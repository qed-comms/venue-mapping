"""Alembic migration script template."""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'b668a8010af2'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add ai_context JSONB column
    op.add_column('project_venues', sa.Column('ai_context', sa.dialects.postgresql.JSONB(), nullable=True))
    
    # Add notes Text column
    op.add_column('project_venues', sa.Column('notes', sa.Text(), nullable=True))


def downgrade() -> None:
    # Remove columns
    op.drop_column('project_venues', 'notes')
    op.drop_column('project_venues', 'ai_context')
