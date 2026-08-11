from logging.config import fileConfig

from alembic import context
from sqlalchemy import create_engine, pool

from app.config import settings
from app.db import Base
from app import models  # noqa: F401 - import so models register on Base.metadata

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

# We deliberately never put the URL through config.set_main_option() /
# alembic.ini's ConfigParser. A percent-encoded password (e.g. "@" becomes
# "%40") contains a literal "%", and ConfigParser's default interpolation
# treats "%" as the start of a placeholder like "%(name)s" - raising
# "invalid interpolation syntax". Passing the URL straight to SQLAlchemy as
# a plain Python string sidesteps ConfigParser entirely, so this works no
# matter what characters are in the password.


def run_migrations_offline() -> None:
    context.configure(
        url=settings.DATABASE_URL,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = create_engine(settings.DATABASE_URL, poolclass=pool.NullPool)
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
