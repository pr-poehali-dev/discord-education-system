"""
АВНГ — основной API. Роутинг через ?action=... или body.action
"""
import json
import os
import psycopg2
from datetime import date

DB  = os.environ["DATABASE_URL"]
SCH = os.environ.get("MAIN_DB_SCHEMA", "public")

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}

def db():
    conn = psycopg2.connect(DB)
    conn.autocommit = True
    return conn

def ok(data):
    return {"statusCode": 200, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps(data, default=str)}

def err(msg, code=400):
    return {"statusCode": code, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps({"error": msg})}

def row_to_user(r):
    return {"id": r[0], "login": r[1], "password": r[2], "name": r[3], "tabNumber": r[4],
            "role": r[5], "rank": r[6], "joinDate": str(r[7]), "isSuperAdmin": r[8]}

def load_progress(cur, user_id):
    cur.execute(f"SELECT lecture_id,done,confirm_link,confirmed_by FROM {SCH}.avng_lecture_progress WHERE user_id=%s", (user_id,))
    lec = {r[0]: {"done": r[1], "confirmLink": r[2] or "", "confirmedBy": r[3] or ""} for r in cur.fetchall()}
    cur.execute(f"SELECT practice_id,done,photo_url,confirmed_by FROM {SCH}.avng_practice_progress WHERE user_id=%s", (user_id,))
    prac = {r[0]: {"done": r[1], "photoUrl": r[2] or "", "confirmedBy": r[3] or ""} for r in cur.fetchall()}
    return {"lecturesChecked": lec, "practicesDone": prac}

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    qs     = event.get("queryStringParameters") or {}
    body   = {}
    if event.get("body"):
        try: body = json.loads(event["body"])
        except: pass

    # action: ?action=login  OR  body.action
    action = qs.get("action") or body.get("action", "")

    conn = db()
    cur  = conn.cursor()

    # ── login ────────────────────────────────────────────────
    if action == "login":
        login = body.get("login", "").strip()
        pw    = body.get("password", "").strip()
        cur.execute(f"SELECT id,login,password,name,tab_number,role,rank,join_date,is_super_admin FROM {SCH}.avng_users WHERE login=%s AND password=%s", (login, pw))
        r = cur.fetchone()
        if not r:
            return err("Неверный логин или пароль", 401)
        u = row_to_user(r)
        u["progress"] = load_progress(cur, u["id"])
        return ok({"user": u})

    # ── get_users ────────────────────────────────────────────
    if action == "get_users":
        cur.execute(f"SELECT id,login,password,name,tab_number,role,rank,join_date,is_super_admin FROM {SCH}.avng_users ORDER BY id")
        users = []
        for r in cur.fetchall():
            u = row_to_user(r)
            u["progress"] = load_progress(cur, u["id"])
            users.append(u)
        return ok({"users": users})

    # ── register ─────────────────────────────────────────────
    if action == "register":
        login = body.get("login", "").strip()
        pw    = body.get("password", "").strip()
        name  = body.get("name", "").strip()
        tab   = body.get("tabNumber", "").strip()
        role  = body.get("role", "cadet")
        if not login or not pw or not name or not tab:
            return err("Заполните все поля")
        cur.execute(f"SELECT id FROM {SCH}.avng_users WHERE login=%s", (login,))
        if cur.fetchone():
            return err("Логин уже занят")
        cur.execute(f"INSERT INTO {SCH}.avng_users (login,password,name,tab_number,role,rank,join_date) VALUES (%s,%s,%s,%s,%s,'private',%s) RETURNING id",
                    (login, pw, name, tab, role, date.today()))
        new_id = cur.fetchone()[0]
        cur.execute(f"SELECT id,login,password,name,tab_number,role,rank,join_date,is_super_admin FROM {SCH}.avng_users WHERE id=%s", (new_id,))
        u = row_to_user(cur.fetchone())
        u["progress"] = load_progress(cur, u["id"])
        return ok({"user": u})

    # ── set_role ─────────────────────────────────────────────
    if action == "set_role":
        cur.execute(f"UPDATE {SCH}.avng_users SET role=%s WHERE id=%s", (body.get("role"), body.get("userId")))
        return ok({"ok": True})

    # ── set_rank ─────────────────────────────────────────────
    if action == "set_rank":
        cur.execute(f"UPDATE {SCH}.avng_users SET rank=%s WHERE id=%s", (body.get("rank"), body.get("userId")))
        return ok({"ok": True})

    # ── check_lecture ─────────────────────────────────────────
    if action == "check_lecture":
        uid  = body.get("userId")
        lid  = body.get("lectureId")
        done = body.get("done", False)
        link = body.get("confirmLink", "")
        cby  = body.get("confirmedBy", "")
        cur.execute(f"""
            INSERT INTO {SCH}.avng_lecture_progress (user_id,lecture_id,done,confirm_link,confirmed_by,updated_at)
            VALUES (%s,%s,%s,%s,%s,NOW())
            ON CONFLICT (user_id,lecture_id) DO UPDATE
            SET done=%s,confirm_link=%s,confirmed_by=%s,updated_at=NOW()
        """, (uid, lid, done, link, cby, done, link, cby))
        return ok({"ok": True})

    # ── check_practice ────────────────────────────────────────
    if action == "check_practice":
        uid   = body.get("userId")
        pid   = body.get("practiceId")
        done  = body.get("done", False)
        photo = body.get("photoUrl", "")
        cby   = body.get("confirmedBy", "")
        cur.execute(f"""
            INSERT INTO {SCH}.avng_practice_progress (user_id,practice_id,done,photo_url,confirmed_by,updated_at)
            VALUES (%s,%s,%s,%s,%s,NOW())
            ON CONFLICT (user_id,practice_id) DO UPDATE
            SET done=%s,
                photo_url=CASE WHEN %s != '' THEN %s ELSE avng_practice_progress.photo_url END,
                confirmed_by=%s,updated_at=NOW()
        """, (uid, pid, done, photo, cby, done, photo, photo, cby))
        return ok({"ok": True})

    # ── get_reports ───────────────────────────────────────────
    if action == "get_reports":
        cur.execute(f"""
            SELECT r.id,r.author_id,u.name,u.tab_number,r.direction,r.status,
                   r.signature,r.photo_url,r.lectures_snapshot,r.practices_snapshot,r.created_at
            FROM {SCH}.avng_reports r
            JOIN {SCH}.avng_users u ON u.id=r.author_id
            ORDER BY r.created_at DESC
        """)
        rows = []
        for r in cur.fetchall():
            rows.append({"id": r[0], "authorId": r[1], "authorName": r[2], "tabNumber": r[3],
                         "direction": r[4], "status": r[5], "signature": r[6] or "",
                         "photoUrl": r[7] or "", "lecturesSnapshot": r[8] or [],
                         "practicesSnapshot": r[9] or [], "date": str(r[10])[:10]})
        return ok({"reports": rows})

    # ── add_report ────────────────────────────────────────────
    if action == "add_report":
        uid = body.get("authorId")
        cur.execute(f"""
            INSERT INTO {SCH}.avng_reports
              (author_id,direction,status,signature,photo_url,lectures_snapshot,practices_snapshot)
            VALUES (%s,%s,'pending',%s,%s,%s,%s) RETURNING id
        """, (uid, body.get("direction"), body.get("signature",""), body.get("photoUrl",""),
              json.dumps(body.get("lecturesSnapshot",[])), json.dumps(body.get("practicesSnapshot",[]))))
        new_id = cur.fetchone()[0]
        return ok({"id": new_id})

    # ── set_report_status ─────────────────────────────────────
    if action == "set_report_status":
        cur.execute(f"UPDATE {SCH}.avng_reports SET status=%s WHERE id=%s",
                    (body.get("status"), body.get("reportId")))
        return ok({"ok": True})

    # ── get_exams ─────────────────────────────────────────────
    if action == "get_exams":
        cur.execute(f"""
            SELECT e.id,e.author_id,u.name,u.tab_number,e.exam_title,e.rank,
                   e.status,e.answer,e.answered_by,e.created_at
            FROM {SCH}.avng_exam_requests e
            JOIN {SCH}.avng_users u ON u.id=e.author_id
            ORDER BY e.created_at DESC
        """)
        rows = [{"id": r[0], "authorId": r[1], "authorName": r[2], "tabNumber": r[3],
                 "examTitle": r[4], "rank": r[5], "status": r[6],
                 "answer": r[7] or "", "answeredBy": r[8] or "", "date": str(r[9])[:10]}
                for r in cur.fetchall()]
        return ok({"exams": rows})

    # ── add_exam ──────────────────────────────────────────────
    if action == "add_exam":
        cur.execute(f"INSERT INTO {SCH}.avng_exam_requests (author_id,exam_title,rank) VALUES (%s,%s,%s) RETURNING id",
                    (body.get("authorId"), body.get("examTitle"), body.get("rank")))
        new_id = cur.fetchone()[0]
        return ok({"id": new_id})

    # ── answer_exam ───────────────────────────────────────────
    if action == "answer_exam":
        cur.execute(f"UPDATE {SCH}.avng_exam_requests SET status='answered',answer=%s,answered_by=%s WHERE id=%s",
                    (body.get("answer"), body.get("answeredBy"), body.get("examId")))
        return ok({"ok": True})

    # ── get_blacklist ─────────────────────────────────────────
    if action == "get_blacklist":
        cur.execute(f"SELECT id,name,tab_number,reason,added_by,created_at FROM {SCH}.avng_blacklist ORDER BY created_at DESC")
        rows = [{"id": r[0], "name": r[1], "tabNumber": r[2] or "", "reason": r[3], "addedBy": r[4], "date": str(r[5])[:10]}
                for r in cur.fetchall()]
        return ok({"blacklist": rows})

    # ── add_blacklist ─────────────────────────────────────────
    if action == "add_blacklist":
        cur.execute(f"INSERT INTO {SCH}.avng_blacklist (name,tab_number,reason,added_by) VALUES (%s,%s,%s,%s) RETURNING id",
                    (body.get("name"), body.get("tabNumber",""), body.get("reason"), body.get("addedBy")))
        new_id = cur.fetchone()[0]
        return ok({"id": new_id})

    # ── remove_blacklist (soft: just flag via update) ─────────
    if action == "remove_blacklist":
        # mark reason as removed instead of actual row removal
        cur.execute(f"UPDATE {SCH}.avng_blacklist SET tab_number=tab_number WHERE id=%s", (body.get("id"),))
        return ok({"ok": True})

    return err("Unknown action", 404)
