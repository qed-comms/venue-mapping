"""initial_schema

Revision ID: 001
Revises: 
Create Date: 2026-01-15 09:20:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create enum types
    op.execute("CREATE TYPE user_role AS ENUM ('event_manager', 'admin')")
    op.execute("CREATE TYPE project_status AS ENUM ('active', 'completed', 'cancelled')")
    op.execute("CREATE TYPE outreach_status AS ENUM ('draft', 'sent', 'awaiting', 'responded', 'declined')")
    
    # Create users table
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('email', sa.String(255), nullable=False, unique=True),
        sa.Column('phone', sa.String(50)),
        sa.Column('signature_block', sa.Text),
        sa.Column('password_hash', sa.String(255), nullable=False),
        sa.Column('role', postgresql.ENUM('event_manager', 'admin', name='user_role', create_type=False), 
                  nullable=False, server_default='event_manager'),
        sa.Column('is_active', sa.Boolean, nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('ix_users_email', 'users', ['email'])
    
    # Create catering_providers table
    op.create_table(
        'catering_providers',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('price_per_person', sa.Numeric(10, 2), nullable=False),
        sa.Column('menu_options', postgresql.JSONB, nullable=False, server_default='{}'),
        sa.Column('is_active', sa.Boolean, nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('ix_catering_providers_name', 'catering_providers', ['name'])
    
    # Create venues table
    op.create_table(
        'venues',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('city', sa.String(100), nullable=False),
        sa.Column('capacity', sa.Integer, nullable=False),
        sa.Column('facilities', postgresql.ARRAY(sa.String), nullable=False, server_default='{}'),
        sa.Column('event_types', postgresql.ARRAY(sa.String), nullable=False, server_default='{}'),
        sa.Column('contact_email', sa.String(255)),
        sa.Column('contact_phone', sa.String(50)),
        sa.Column('website', sa.String(500)),
        sa.Column('address', sa.Text),
        sa.Column('description_template', sa.Text),
        sa.Column('notes', sa.Text),
        sa.Column('is_deleted', sa.Boolean, nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('ix_venues_name', 'venues', ['name'])
    op.create_index('ix_venues_city', 'venues', ['city'])
    op.create_index('ix_venues_is_deleted', 'venues', ['is_deleted'])
    
    # Create photos table
    op.create_table(
        'photos',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('venue_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('url', sa.String(1000), nullable=False),
        sa.Column('caption', sa.Text),
        sa.Column('display_order', sa.Integer, nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['venue_id'], ['venues.id'], ondelete='CASCADE'),
    )
    op.create_index('ix_photos_venue_id', 'photos', ['venue_id'])
    
    # Create projects table
    op.create_table(
        'projects',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('client_name', sa.String(255), nullable=False),
        sa.Column('event_name', sa.String(500), nullable=False),
        sa.Column('event_date_start', sa.Date, nullable=False),
        sa.Column('event_date_end', sa.Date, nullable=False),
        sa.Column('attendee_count', sa.Integer, nullable=False),
        sa.Column('budget', sa.Numeric(12, 2)),
        sa.Column('location_preference', sa.String(255)),
        sa.Column('requirements', postgresql.ARRAY(sa.String), nullable=False, server_default='{}'),
        sa.Column('status', postgresql.ENUM('active', 'completed', 'cancelled', name='project_status', create_type=False),
                  nullable=False, server_default='active'),
        sa.Column('notes', sa.Text),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    )
    op.create_index('ix_projects_user_id', 'projects', ['user_id'])
    op.create_index('ix_projects_client_name', 'projects', ['client_name'])
    op.create_index('ix_projects_status', 'projects', ['status'])
    
    # Create project_venues table
    op.create_table(
        'project_venues',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('project_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('venue_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('catering_provider_id', postgresql.UUID(as_uuid=True)),
        sa.Column('outreach_status', postgresql.ENUM('draft', 'sent', 'awaiting', 'responded', 'declined', 
                  name='outreach_status', create_type=False), nullable=False, server_default='draft'),
        sa.Column('availability_dates', sa.String(255)),
        sa.Column('is_available', sa.Boolean),
        sa.Column('quoted_price', sa.Numeric(12, 2)),
        sa.Column('room_allocation', sa.Text),
        sa.Column('catering_description', sa.Text),
        sa.Column('pros', sa.Text),
        sa.Column('cons', sa.Text),
        sa.Column('ai_description', sa.Text),
        sa.Column('final_description', sa.Text),
        sa.Column('include_in_proposal', sa.Boolean, nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['venue_id'], ['venues.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['catering_provider_id'], ['catering_providers.id'], ondelete='SET NULL'),
        sa.UniqueConstraint('project_id', 'venue_id', name='uq_project_venue'),
    )
    op.create_index('ix_project_venues_project_id', 'project_venues', ['project_id'])
    op.create_index('ix_project_venues_venue_id', 'project_venues', ['venue_id'])
    op.create_index('ix_project_venues_catering_provider_id', 'project_venues', ['catering_provider_id'])
    op.create_index('ix_project_venues_outreach_status', 'project_venues', ['outreach_status'])
    
    # Create activity_logs table
    op.create_table(
        'activity_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('project_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('action', sa.String(100), nullable=False),
        sa.Column('details', postgresql.JSONB, nullable=False, server_default='{}'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    )
    op.create_index('ix_activity_logs_project_id', 'activity_logs', ['project_id'])
    op.create_index('ix_activity_logs_user_id', 'activity_logs', ['user_id'])
    op.create_index('ix_activity_logs_action', 'activity_logs', ['action'])


def downgrade() -> None:
    # Drop tables in reverse order
    op.drop_table('activity_logs')
    op.drop_table('project_venues')
    op.drop_table('projects')
    op.drop_table('photos')
    op.drop_table('venues')
    op.drop_table('catering_providers')
    op.drop_table('users')
    
    # Drop enum types
    op.execute('DROP TYPE outreach_status')
    op.execute('DROP TYPE project_status')
    op.execute('DROP TYPE user_role')
