"""add factory checklists

Revision ID: b7e31d5a2f90
Revises: 8d2f1a4c9b31
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "b7e31d5a2f90"
down_revision = "8d2f1a4c9b31"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table("factory_visits", sa.Column("id", sa.BigInteger(), primary_key=True), sa.Column("title", sa.String(120), nullable=False), sa.Column("factory_name", sa.String(120)), sa.Column("visit_date", sa.Date()), sa.Column("notes", sa.Text()), sa.Column("created_at", sa.DateTime(timezone=True), nullable=False), sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False))
    op.create_table("factory_check_items", sa.Column("id", sa.BigInteger(), primary_key=True), sa.Column("visit_id", sa.BigInteger(), nullable=False), sa.Column("item_key", sa.String(80), nullable=False), sa.Column("section", sa.String(80), nullable=False), sa.Column("label", sa.String(200), nullable=False), sa.Column("position", sa.Integer(), nullable=False), sa.Column("status", sa.String(20), server_default="未檢查", nullable=False), sa.Column("captured_value", sa.Text()), sa.Column("evidence_source", sa.String(200)), sa.Column("notes", sa.Text()), sa.Column("follow_up_question", sa.Text()), sa.Column("change_history", postgresql.JSONB(), server_default="[]", nullable=False), sa.Column("verification_state", sa.String(20), server_default="待確認", nullable=False), sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False), sa.ForeignKeyConstraint(["visit_id"], ["factory_visits.id"], ondelete="CASCADE"), sa.UniqueConstraint("visit_id", "item_key", name="uq_factory_check_items_visit_key"), sa.CheckConstraint("status IN ('未檢查', '已確認', '不適用', '有問題')", name="ck_factory_check_items_status"), sa.CheckConstraint("verification_state IN ('待確認', '已驗證')", name="ck_factory_check_items_verification"))
    op.create_index("ix_factory_check_items_visit_id", "factory_check_items", ["visit_id"])


def downgrade():
    op.drop_index("ix_factory_check_items_visit_id", table_name="factory_check_items")
    op.drop_table("factory_check_items")
    op.drop_table("factory_visits")
