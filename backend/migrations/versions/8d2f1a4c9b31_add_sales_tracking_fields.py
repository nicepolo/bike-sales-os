"""add sales tracking fields

Revision ID: 8d2f1a4c9b31
Revises: c5e4a62cb5e7
"""
from alembic import op
import sqlalchemy as sa

revision = "8d2f1a4c9b31"
down_revision = "c5e4a62cb5e7"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("customers", sa.Column("sales_owner", sa.String(length=20), nullable=True))
    op.add_column("customers", sa.Column("source_platform", sa.String(length=30), nullable=True))
    op.add_column("customers", sa.Column("audience_segment", sa.String(length=50), nullable=True))
    op.add_column("customers", sa.Column("preferred_language", sa.String(length=30), nullable=True))
    op.add_column("customers", sa.Column("interested_price", sa.Numeric(10, 2), nullable=True))
    op.add_column("customers", sa.Column("next_action", sa.String(length=200), nullable=True))
    op.add_column("customers", sa.Column("next_action_due_date", sa.Date(), nullable=True))
    op.create_check_constraint("ck_customers_sales_owner", "customers", "sales_owner IS NULL OR sales_owner IN ('Polo', 'Daniel')")


def downgrade():
    op.drop_constraint("ck_customers_sales_owner", "customers", type_="check")
    for name in ("next_action_due_date", "next_action", "interested_price", "preferred_language", "audience_segment", "source_platform", "sales_owner"):
        op.drop_column("customers", name)
