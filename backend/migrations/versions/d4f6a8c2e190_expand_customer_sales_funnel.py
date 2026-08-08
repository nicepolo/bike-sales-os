"""expand customer sales funnel

Revision ID: d4f6a8c2e190
Revises: b7e31d5a2f90
"""
from alembic import op
import sqlalchemy as sa


revision = "d4f6a8c2e190"
down_revision = "b7e31d5a2f90"
branch_labels = None
depends_on = None

LEGACY_STATUS_MAPPING = {
    "詢問中": "新詢問",
    "預約試騎": "預約試騎",
    # The requested funnel has no completed-test-ride stage. Keep the exact
    # original value in legacy_status and use the nearest non-commercial stage.
    "已試騎": "預約試騎",
    # A legacy deal proves a deal, but not payment or delivery.
    "已成交": "已下訂",
    "未成交": "流失",
}


def _legacy_status_update_sql():
    clauses = " ".join(f"WHEN '{old}' THEN '{new}'" for old, new in LEGACY_STATUS_MAPPING.items())
    return f"UPDATE customers SET status = CASE status {clauses} ELSE status END"


def upgrade():
    op.add_column("customers", sa.Column("customer_segment", sa.String(length=20), nullable=True))
    op.add_column("customers", sa.Column("source", sa.String(length=30), nullable=True))
    op.add_column("customers", sa.Column("language", sa.String(length=20), nullable=True))
    op.add_column("customers", sa.Column("interested_quantity", sa.Integer(), nullable=True))
    op.add_column("customers", sa.Column("legacy_status", sa.String(length=20), nullable=True))

    # Legacy tracking fields remain intact. Only safely recognizable values are copied.
    op.execute("""
        UPDATE customers SET customer_segment = CASE
            WHEN audience_segment IN ('學生', '外籍移工', '通勤族', '親子家庭', '銀髮族', '其他') THEN audience_segment
            ELSE NULL END
    """)
    op.execute("""
        UPDATE customers SET source = CASE
            WHEN source_platform IN ('TikTok', 'Instagram', 'Facebook社團', 'LINE', '朋友介紹', '現場', '其他') THEN source_platform
            WHEN source_platform = 'Facebook廣告' THEN 'Facebook'
            ELSE NULL END
    """)
    op.execute("""
        UPDATE customers SET language = CASE
            WHEN preferred_language IN ('中文', '越南文', '印尼文', '泰文', '其他') THEN preferred_language
            ELSE NULL END
    """)

    op.drop_constraint("ck_customers_status", "customers", type_="check")
    op.execute("UPDATE customers SET legacy_status = status")
    op.execute(_legacy_status_update_sql())
    op.alter_column("customers", "status", server_default="新詢問")
    op.create_check_constraint(
        "ck_customers_status", "customers",
        "status IN ('新詢問', '已聯絡', '預約試騎', '已下訂', '已付款', '已交車', '流失')",
    )
    op.create_check_constraint("ck_customers_segment", "customers", "customer_segment IS NULL OR customer_segment IN ('學生', '外籍移工', '通勤族', '親子家庭', '銀髮族', '其他')")
    op.create_check_constraint("ck_customers_source", "customers", "source IS NULL OR source IN ('TikTok', 'Facebook', 'Instagram', 'Facebook社團', 'LINE', '朋友介紹', '現場', '其他')")
    op.create_check_constraint("ck_customers_language", "customers", "language IS NULL OR language IN ('中文', '越南文', '印尼文', '泰文', '其他')")
    op.create_check_constraint("ck_customers_interested_quantity", "customers", "interested_quantity IS NULL OR interested_quantity > 0")


def downgrade():
    op.drop_constraint("ck_customers_interested_quantity", "customers", type_="check")
    op.drop_constraint("ck_customers_language", "customers", type_="check")
    op.drop_constraint("ck_customers_source", "customers", type_="check")
    op.drop_constraint("ck_customers_segment", "customers", type_="check")
    op.drop_constraint("ck_customers_status", "customers", type_="check")
    op.execute("""
        UPDATE customers SET status = COALESCE(legacy_status, CASE status
            WHEN '新詢問' THEN '詢問中'
            WHEN '已聯絡' THEN '詢問中'
            WHEN '預約試騎' THEN '預約試騎'
            WHEN '已下訂' THEN '已成交'
            WHEN '已付款' THEN '已成交'
            WHEN '已交車' THEN '已成交'
            WHEN '流失' THEN '未成交'
            ELSE status END)
    """)
    op.alter_column("customers", "status", server_default="詢問中")
    op.create_check_constraint("ck_customers_status", "customers", "status IN ('詢問中', '預約試騎', '已試騎', '已成交', '未成交')")
    op.drop_column("customers", "legacy_status")
    op.drop_column("customers", "interested_quantity")
    op.drop_column("customers", "language")
    op.drop_column("customers", "source")
    op.drop_column("customers", "customer_segment")
