"""initial schema: users, ambulances, calls, otp_codes

Mirrors database/schema.sql so a fresh database can be built with
`alembic upgrade head`. For a database already created from schema.sql,
run `alembic stamp head` instead of upgrading.

Revision ID: 0001
Revises:
Create Date: 2026-06-04
"""
from alembic import op
import sqlalchemy as sa

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("phone", sa.Text, nullable=False, unique=True),
        sa.Column("role", sa.Text, nullable=False, server_default="patient"),
        sa.Column("full_name", sa.Text),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.CheckConstraint("role IN ('patient','driver','dispatcher')", name="users_role_check"),
    )
    op.create_table(
        "ambulances",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("driver_id", sa.Integer, sa.ForeignKey("users.id", ondelete="SET NULL")),
        sa.Column("plate_number", sa.Text),
        sa.Column("status", sa.Text, nullable=False, server_default="off_duty"),
        sa.Column("lat", sa.Float),
        sa.Column("lng", sa.Float),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.CheckConstraint("status IN ('available','on_call','off_duty')", name="ambulances_status_check"),
    )
    op.create_table(
        "calls",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("patient_id", sa.Integer, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("ambulance_id", sa.Integer, sa.ForeignKey("ambulances.id", ondelete="SET NULL")),
        sa.Column("pickup_lat", sa.Float, nullable=False),
        sa.Column("pickup_lng", sa.Float, nullable=False),
        sa.Column("pickup_address", sa.Text),
        sa.Column("notes", sa.Text),
        sa.Column("status", sa.Text, nullable=False, server_default="requested"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("assigned_at", sa.DateTime(timezone=True)),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.CheckConstraint(
            "status IN ('requested','assigned','en_route','arrived','transporting','completed','cancelled')",
            name="calls_status_check",
        ),
    )
    op.create_table(
        "otp_codes",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("phone", sa.Text, nullable=False),
        sa.Column("code_hash", sa.Text, nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("consumed_at", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("idx_calls_status", "calls", ["status"])
    op.create_index("idx_ambulances_status", "ambulances", ["status"])
    op.create_index("idx_ambulances_driver", "ambulances", ["driver_id"])
    op.create_index("idx_otp_phone", "otp_codes", ["phone", "expires_at"])


def downgrade() -> None:
    op.drop_index("idx_otp_phone", table_name="otp_codes")
    op.drop_index("idx_ambulances_driver", table_name="ambulances")
    op.drop_index("idx_ambulances_status", table_name="ambulances")
    op.drop_index("idx_calls_status", table_name="calls")
    op.drop_table("otp_codes")
    op.drop_table("calls")
    op.drop_table("ambulances")
    op.drop_table("users")
