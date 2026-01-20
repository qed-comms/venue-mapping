"""add_client_model

Revision ID: b875bd43a330
Revises: b668a8010af2
Create Date: 2026-01-20 12:20:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'b875bd43a330'
down_revision = 'b668a8010af2'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Create clients table
    op.create_table('clients',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('name', sa.String(length=255), nullable=False),
    sa.Column('industry', sa.String(length=255), nullable=True),
    sa.Column('website', sa.String(length=500), nullable=True),
    sa.Column('logo_url', sa.String(length=500), nullable=True),
    sa.Column('brand_tone', sa.String(length=500), nullable=True),
    sa.Column('description_preferences', sa.Text(), nullable=True),
    sa.Column('standard_requirements', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.Column('notes', sa.Text(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_clients_name'), 'clients', ['name'], unique=True)

    # 2. Add client_id to projects
    op.add_column('projects', sa.Column('client_id', sa.UUID(), nullable=True))
    op.create_index(op.f('ix_projects_client_id'), 'projects', ['client_id'], unique=False)
    op.create_foreign_key(None, 'projects', 'clients', ['client_id'], ['id'], ondelete='SET NULL')


def downgrade() -> None:
    # 1. Remove client_id from projects
    op.drop_constraint(None, 'projects', type_='foreignkey')
    op.drop_index(op.f('ix_projects_client_id'), table_name='projects')
    op.drop_column('projects', 'client_id')

    # 2. Remove clients table
    op.drop_index(op.f('ix_clients_name'), table_name='clients')
    op.drop_table('clients')
