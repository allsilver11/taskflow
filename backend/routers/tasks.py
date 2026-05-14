from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from database import get_db

router = APIRouter()

VALID_STATUSES = ["todo", "in_progress", "done"]


class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None


class TaskStatusUpdate(BaseModel):
    status: str


@router.get("/tasks")
def get_tasks():
    # 전체 업무 목록 조회 (최신순)
    with get_db() as conn:
        rows = conn.execute(
            "SELECT * FROM tasks ORDER BY created_at DESC"
        ).fetchall()
        return [dict(row) for row in rows]


@router.post("/tasks", status_code=201)
def create_task(body: TaskCreate):
    # 새 업무 생성
    with get_db() as conn:
        cursor = conn.execute(
            "INSERT INTO tasks (title, description) VALUES (?, ?)",
            (body.title, body.description),
        )
        conn.commit()
        row = conn.execute(
            "SELECT * FROM tasks WHERE id = ?", (cursor.lastrowid,)
        ).fetchone()
        return dict(row)


@router.patch("/tasks/{task_id}")
def update_task_status(task_id: int, body: TaskStatusUpdate):
    # 업무 상태 변경
    if body.status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail=f"상태값은 {VALID_STATUSES} 중 하나여야 합니다")

    with get_db() as conn:
        result = conn.execute(
            "UPDATE tasks SET status = ? WHERE id = ?", (body.status, task_id)
        )
        conn.commit()
        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="업무를 찾을 수 없습니다")
        row = conn.execute(
            "SELECT * FROM tasks WHERE id = ?", (task_id,)
        ).fetchone()
        return dict(row)


@router.delete("/tasks/{task_id}")
def delete_task(task_id: int):
    # 업무 삭제
    with get_db() as conn:
        result = conn.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
        conn.commit()
        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="업무를 찾을 수 없습니다")
        return {"message": "삭제되었습니다"}
