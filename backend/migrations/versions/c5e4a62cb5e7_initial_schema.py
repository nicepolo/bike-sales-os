"""initial schema

Revision ID: c5e4a62cb5e7
Revises: 
Create Date: 2026-08-06 11:31:42.971280

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = 'c5e4a62cb5e7'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "vehicles",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("vehicle_code", sa.String(length=50), nullable=False),
        sa.Column("battery_code", sa.String(length=100), nullable=True),
        sa.Column("battery_health", sa.String(length=100), nullable=True),
        sa.Column("source_type", sa.String(length=20), nullable=False),
        sa.Column("condition_grade", sa.String(length=20), nullable=False),
        sa.Column("suggested_price", sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column("price_tier", sa.Integer(), nullable=True),
        sa.Column("photo_urls", postgresql.JSONB(astext_type=sa.Text()), server_default="[]", nullable=False),
        sa.Column("status", sa.String(length=20), server_default="待上架", nullable=False),
        sa.Column("location", sa.String(length=100), nullable=True),
        sa.Column("listed_date", sa.Date(), nullable=True),
        sa.Column("sold_date", sa.Date(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("source_type IN ('全新', '退役車')", name="ck_vehicles_source_type"),
        sa.CheckConstraint("condition_grade IN ('全新', '9成新', '需維修')", name="ck_vehicles_condition_grade"),
        sa.CheckConstraint(
            "status IN ('待上架', '已上架', '預約試騎', '已成交', '已交車')", name="ck_vehicles_status"
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("vehicle_code"),
    )
    op.create_index(op.f("ix_vehicles_status"), "vehicles", ["status"], unique=False)

    op.create_table(
        "customers",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("contact", sa.String(length=100), nullable=True),
        sa.Column("channel", sa.String(length=20), nullable=False),
        sa.Column("vehicle_id", sa.BigInteger(), nullable=True),
        sa.Column("status", sa.String(length=20), server_default="詢問中", nullable=False),
        sa.Column("deal_amount", sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column("deal_date", sa.Date(), nullable=True),
        sa.Column("is_batch_deal", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("batch_note", sa.Text(), nullable=True),
        sa.Column("referrer", sa.String(length=100), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("channel IN ('B2B', 'B2C', '經銷')", name="ck_customers_channel"),
        sa.CheckConstraint(
            "status IN ('詢問中', '預約試騎', '已試騎', '已成交', '未成交')", name="ck_customers_status"
        ),
        sa.ForeignKeyConstraint(["vehicle_id"], ["vehicles.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_customers_channel"), "customers", ["channel"], unique=False)
    op.create_index(op.f("ix_customers_vehicle_id"), "customers", ["vehicle_id"], unique=False)


def downgrade():
    op.drop_index(op.f("ix_customers_vehicle_id"), table_name="customers")
    op.drop_index(op.f("ix_customers_channel"), table_name="customers")
    op.drop_table("customers")
    op.drop_index(op.f("ix_vehicles_status"), table_name="vehicles")
    op.drop_table("vehicles")
