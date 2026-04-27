from fastapi import FastAPI, APIRouter, HTTPException, Header, Depends
from dotenv import load_dotenv, dotenv_values
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import random
import smtplib
import ssl
import hashlib
import socket
import requests

import json
from threading import Lock
from email.message import EmailMessage
from jose import jwt, JWTError
from pydantic import EmailStr


ROOT_DIR = Path(__file__).resolve().parent

# Lee variables desde varios lugares posibles para evitar que Windows/Uvicorn use otro .env.
# Prioridad: backend/.env -> carpeta actual/.env -> carpeta padre/.env -> variables del sistema.
ENV_CANDIDATE_FILES = []
for candidate in [ROOT_DIR / '.env', Path.cwd() / '.env', ROOT_DIR.parent / '.env']:
    try:
        resolved = candidate.resolve()
    except Exception:
        resolved = candidate
    if resolved not in ENV_CANDIDATE_FILES:
        ENV_CANDIDATE_FILES.append(resolved)

for env_file in ENV_CANDIDATE_FILES:
    if env_file.exists():
        load_dotenv(env_file, override=True)


def _env_value(*keys: str, default: str = '') -> str:
    for key in keys:
        for env_file in ENV_CANDIDATE_FILES:
            try:
                value = dotenv_values(env_file).get(key)
            except Exception:
                value = None
            if value is not None and str(value).strip() != '':
                return str(value).strip().strip('"').strip("'")
        value = os.environ.get(key)
        if value is not None and str(value).strip() != '':
            return str(value).strip().strip('"').strip("'")
    return default


def _env_bool(key: str, default: bool = False) -> bool:
    raw = _env_value(key, default='true' if default else 'false').strip().lower()
    return raw in {'1', 'true', 'yes', 'on'}

# Data storage
mongo_url = _env_value('MONGO_URL', default='mongodb://localhost:27017')
db_name = _env_value('DB_NAME', default='gastospro')
USE_FILE_STORAGE = _env_bool('USE_FILE_STORAGE', True)
STORAGE_FILE = ROOT_DIR / 'local_auth_store.json'
_storage_lock = Lock()


def _load_store():
    if not STORAGE_FILE.exists():
        return {'auth_codes': [], 'allowed_login_emails': [], 'status_checks': []}
    try:
        return json.loads(STORAGE_FILE.read_text(encoding='utf-8'))
    except Exception:
        return {'auth_codes': [], 'allowed_login_emails': [], 'status_checks': []}


def _save_store(store):
    STORAGE_FILE.write_text(json.dumps(store, ensure_ascii=False, indent=2), encoding='utf-8')

AUTH_CODES_COLLECTION = 'auth_codes'
ALLOWED_EMAILS_COLLECTION = 'allowed_login_emails'
JWT_SECRET = _env_value('JWT_SECRET', default='change-this-in-production')
JWT_ALGORITHM = 'HS256'
OTP_EXPIRATION_MINUTES = int(_env_value('OTP_EXPIRATION_MINUTES', default='10'))
OTP_COOLDOWN_SECONDS = int(_env_value('OTP_COOLDOWN_SECONDS', default='45'))
SESSION_EXPIRATION_HOURS = int(_env_value('SESSION_EXPIRATION_HOURS', default='12'))
DEFAULT_BOOTSTRAP_ADMIN_EMAIL = 'yuniorm001@gmail.com'
DEFAULT_ADMIN_PASSWORD = _env_value('DEFAULT_ADMIN_PASSWORD', default='280599')
SUPABASE_URL = _env_value('SUPABASE_URL', default='https://iidxyrfmlljdmgeoeqqx.supabase.co').rstrip('/')
SUPABASE_ANON_KEY = _env_value('SUPABASE_ANON_KEY', 'SUPABASE_KEY', default='')
SUPABASE_SERVICE_ROLE_KEY = _env_value(
    'SUPABASE_SERVICE_ROLE_KEY',
    'SUPABASE_SERVICE_KEY',
    'SUPABASE_SECRET_KEY',
    'SERVICE_ROLE_KEY',
    'SERVICE_ROLE',
    default='',
)
SUPABASE_SERVER_KEY = SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY
SUPABASE_APP_DATA_TABLE = _env_value('SUPABASE_APP_DATA_TABLE', default='app_user_data')
SUPABASE_ALLOWED_EMAILS_KEY = _env_value('SUPABASE_ALLOWED_EMAILS_KEY', default='__allowed_login_emails__')
ALLOWED_LOGIN_EMAILS = {email.strip().lower() for email in _env_value('ALLOWED_LOGIN_EMAILS', default=DEFAULT_BOOTSTRAP_ADMIN_EMAIL).split(',') if email.strip()}
ADMIN_LOGIN_EMAILS = {email.strip().lower() for email in _env_value('ADMIN_LOGIN_EMAILS', default=DEFAULT_BOOTSTRAP_ADMIN_EMAIL).split(',') if email.strip()}

SMTP_PLACEHOLDER_VALUES = {
    '',
    'PON_AQUI_LA_CONTRASENA_REAL_DEL_BUZON',
    'PON_AQUI_TU_APP_PASSWORD_DE_GMAIL',
    'CHANGE_ME',
    'YOUR_SMTP_PASSWORD_HERE',
}

KNOWN_SMTP_PROVIDERS = {
    'namecheap_privateemail': {
        'host': 'mail.privateemail.com',
        'port': 587,
        'secure_ssl': False,
        'use_starttls': 'true',
        'username_from_email': True,
        'source': 'provider:namecheap_privateemail',
    },
    'gmail': {
        'host': 'smtp.gmail.com',
        'port': 587,
        'secure_ssl': False,
        'use_starttls': 'true',
        'username_from_email': True,
        'source': 'provider:gmail',
    },
}

def _read_env_value(key: str, default: str = '') -> str:
    return _env_value(key, default=default)

def _read_env_int(key: str, default: int) -> int:
    raw = _read_env_value(key, str(default))
    try:
        return int(str(raw).strip())
    except Exception:
        return int(default)

def _read_env_bool(key: str, default: bool) -> bool:
    raw = _read_env_value(key, 'true' if default else 'false').strip().lower()
    return raw in {'1', 'true', 'yes', 'on'}

def guess_smtp_provider_from_email(email: str) -> str:
    domain = email.split('@')[-1].lower() if '@' in email else ''
    if domain in {'yuniormesa.com', 'lizonexus.com', 'lizonenexus.com'}:
        return 'namecheap_privateemail'
    if domain == 'gmail.com':
        return 'gmail'
    return ''


def _read_env_optional_secret(*keys: str) -> str:
    for key in keys:
        value = _read_env_value(key, '')
        if value and value not in SMTP_PLACEHOLDER_VALUES:
            return value
    return ''

def get_runtime_email_delivery_config() -> dict:
    resend_api_key = _read_env_optional_secret('RESEND_API_KEY')
    resend_from_email = _read_env_value('RESEND_FROM_EMAIL', _read_env_value('SMTP_FROM_EMAIL', DEFAULT_BOOTSTRAP_ADMIN_EMAIL) or DEFAULT_BOOTSTRAP_ADMIN_EMAIL)
    resend_from_name = _read_env_value('RESEND_FROM_NAME', _read_env_value('SMTP_FROM_NAME', 'Acceso seguro') or 'Acceso seguro')
    resend_api_base = _read_env_value('RESEND_API_BASE', 'https://api.resend.com')

    smtp = get_runtime_smtp_config()

    preferred_order_raw = _read_env_value('EMAIL_DELIVERY_ORDER', 'resend,smtp')
    preferred_order = [item.strip().lower() for item in preferred_order_raw.split(',') if item.strip()]
    if not preferred_order:
        preferred_order = ['resend', 'smtp']

    providers = []
    if resend_api_key:
        providers.append({
            'type': 'resend',
            'api_key': resend_api_key,
            'from_email': resend_from_email,
            'from_name': resend_from_name,
            'api_base': resend_api_base.rstrip('/'),
            'is_ready': True,
        })

    smtp_ready = bool(smtp.get('host') and smtp.get('from_email') and (not smtp.get('require_auth') or (smtp.get('username') and smtp.get('password'))))
    providers.append({
        'type': 'smtp',
        'config': smtp,
        'is_ready': smtp_ready,
    })

    providers_by_type = {provider['type']: provider for provider in providers}
    ordered = []
    for provider_type in preferred_order:
        provider = providers_by_type.get(provider_type)
        if provider:
            ordered.append(provider)

    for provider in providers:
        if provider['type'] not in {item['type'] for item in ordered}:
            ordered.append(provider)

    return {
        'providers': ordered,
        'preferred_order': preferred_order,
        'has_ready_provider': any(provider.get('is_ready') for provider in ordered),
        'resend_enabled': bool(resend_api_key),
        'smtp_enabled': smtp_ready,
    }

def send_email_via_resend(recipient: str, subject: str, text_body: str) -> None:
    api_key = _read_env_optional_secret('RESEND_API_KEY')
    if not api_key:
        raise RuntimeError('RESEND_API_KEY no está configurado.')

    from_email = _read_env_value('RESEND_FROM_EMAIL', _read_env_value('SMTP_FROM_EMAIL', DEFAULT_BOOTSTRAP_ADMIN_EMAIL) or DEFAULT_BOOTSTRAP_ADMIN_EMAIL)
    from_name = _read_env_value('RESEND_FROM_NAME', _read_env_value('SMTP_FROM_NAME', 'Acceso seguro') or 'Acceso seguro')
    api_base = _read_env_value('RESEND_API_BASE', 'https://api.resend.com').rstrip('/')

    payload = {
        'from': f'{from_name} <{from_email}>',
        'to': [recipient],
        'subject': subject,
        'text': text_body,
    }

    try:
        response = requests.post(
            f'{api_base}/emails',
            headers={
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json',
            },
            json=payload,
            timeout=_read_env_int('SMTP_TIMEOUT_SECONDS', 20),
        )
    except requests.RequestException as exc:
        raise RuntimeError(f'No pude conectar con Resend: {exc}') from exc

    if 200 <= response.status_code < 300:
        return

    try:
        error_payload = response.json()
    except Exception:
        error_payload = {'message': response.text[:400]}

    message = error_payload.get('message') or error_payload.get('error') or response.text[:400]
    raise RuntimeError(f'Resend rechazó el envío: {message}')

def send_email_via_smtp_message(recipient: str, subject: str, text_body: str) -> None:
    runtime_smtp = get_runtime_smtp_config()
    smtp_host = runtime_smtp['host']
    smtp_port = runtime_smtp['port']
    smtp_secure_ssl = runtime_smtp['secure_ssl']
    smtp_use_starttls = runtime_smtp['use_starttls']
    smtp_username = runtime_smtp['username']
    smtp_password = runtime_smtp['password']
    smtp_require_auth = runtime_smtp['require_auth']
    smtp_from_email = runtime_smtp['from_email']
    smtp_from_name = runtime_smtp['from_name']
    smtp_timeout_seconds = runtime_smtp['timeout_seconds']
    smtp_provider = runtime_smtp.get('provider_key', '')
    smtp_app_password_hint = runtime_smtp.get('app_password_hint', 'Usa una App Password si tu proveedor la exige.')

    if not (smtp_host and smtp_from_email):
        raise RuntimeError('No encontré la salida SMTP. Revisa backend/.env y completa SMTP_HOST y SMTP_FROM_EMAIL.')

    if runtime_smtp.get('password_is_placeholder'):
        raise RuntimeError('SMTP_PASSWORD todavía tiene un texto de ejemplo. Debes colocar una credencial real del emisor.')

    if smtp_require_auth and not (smtp_username and smtp_password):
        raise RuntimeError('Falta la credencial real del buzón emisor en backend/.env.')

    message = EmailMessage()
    message['Subject'] = subject
    message['From'] = f"{smtp_from_name} <{smtp_from_email}>"
    message['To'] = recipient
    message.set_content(text_body)

    context = ssl.create_default_context()

    try:
        if smtp_secure_ssl:
            with smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=smtp_timeout_seconds, context=context) as smtp:
                if smtp_require_auth:
                    smtp.login(smtp_username, smtp_password)
                smtp.send_message(message)
        else:
            with smtplib.SMTP(smtp_host, smtp_port, timeout=smtp_timeout_seconds) as smtp:
                smtp.ehlo()
                if smtp_use_starttls:
                    smtp.starttls(context=context)
                    smtp.ehlo()
                if smtp_require_auth:
                    smtp.login(smtp_username, smtp_password)
                smtp.send_message(message)
    except smtplib.SMTPAuthenticationError as exc:
        provider_hint = 'Gmail requiere una App Password de 16 caracteres con verificación en 2 pasos activa.' if (smtp_provider == 'gmail' or smtp_username.lower().endswith('@gmail.com')) else smtp_app_password_hint
        raise RuntimeError(f'El servidor SMTP rechazó el usuario o la contraseña. Revisa SMTP_USERNAME y SMTP_PASSWORD. {provider_hint}') from exc
    except smtplib.SMTPConnectError as exc:
        raise RuntimeError(f'No pude conectar al servidor SMTP {smtp_host}:{smtp_port}. Revisa host, puerto y firewall.') from exc
    except (smtplib.SMTPServerDisconnected, socket.timeout, TimeoutError) as exc:
        raise RuntimeError('La conexión al servidor de correo expiró o se cerró antes de terminar. Revisa el puerto y la seguridad TLS/SSL.') from exc
    except smtplib.SMTPException as exc:
        raise RuntimeError(f'Error SMTP al enviar el código: {exc}') from exc

def get_runtime_smtp_config() -> dict:
    smtp_from_email = _read_env_value('SMTP_FROM_EMAIL', DEFAULT_BOOTSTRAP_ADMIN_EMAIL) or DEFAULT_BOOTSTRAP_ADMIN_EMAIL
    smtp_provider = _read_env_value('SMTP_PROVIDER', '').lower() or guess_smtp_provider_from_email(smtp_from_email)
    provider = KNOWN_SMTP_PROVIDERS.get(smtp_provider, {})

    host = _read_env_value('SMTP_HOST', provider.get('host', ''))
    port = _read_env_int('SMTP_PORT', int(provider.get('port', 587)))
    secure_ssl = _read_env_bool('SMTP_SECURE_SSL', bool(provider.get('secure_ssl', False)))
    use_starttls = _read_env_bool('SMTP_USE_STARTTLS', str(provider.get('use_starttls', 'true')).lower() in {'1', 'true', 'yes', 'on'})
    username_default = smtp_from_email if provider.get('username_from_email') else ''
    username = _read_env_value('SMTP_USERNAME', username_default) or username_default
    password = _read_env_value('SMTP_PASSWORD', '')
    password_is_placeholder = password in SMTP_PLACEHOLDER_VALUES
    smtp_require_auth = _read_env_bool('SMTP_REQUIRE_AUTH', True)
    smtp_timeout_seconds = _read_env_int('SMTP_TIMEOUT_SECONDS', 20)
    smtp_from_name = _read_env_value('SMTP_FROM_NAME', 'Acceso seguro')
    app_password_hint = _read_env_value('SMTP_APP_PASSWORD_HINT', 'Usa una App Password si tu proveedor la exige.')

    source = 'env'
    if provider and not _read_env_value('SMTP_HOST', ''):
        source = provider.get('source', 'provider')

    return {
        'provider_key': smtp_provider,
        'host': host,
        'port': port,
        'secure_ssl': secure_ssl,
        'use_starttls': use_starttls,
        'username': username,
        'password': '' if password_is_placeholder else password,
        'password_is_placeholder': password_is_placeholder,
        'source': source,
        'require_auth': smtp_require_auth,
        'from_email': smtp_from_email,
        'from_name': smtp_from_name,
        'timeout_seconds': smtp_timeout_seconds,
        'app_password_hint': app_password_hint,
    }

SMTP_CONFIG = get_runtime_smtp_config()
SMTP_HOST = SMTP_CONFIG['host']
SMTP_PORT = SMTP_CONFIG['port']
SMTP_SECURE_SSL = SMTP_CONFIG['secure_ssl']
SMTP_USE_STARTTLS = 'true' if SMTP_CONFIG['use_starttls'] else 'false'
SMTP_USERNAME = SMTP_CONFIG['username']
SMTP_PASSWORD = SMTP_CONFIG['password']
SMTP_REQUIRE_AUTH = SMTP_CONFIG['require_auth']
SMTP_FROM_EMAIL = SMTP_CONFIG['from_email']
SMTP_FROM_NAME = SMTP_CONFIG['from_name']
SMTP_TIMEOUT_SECONDS = SMTP_CONFIG['timeout_seconds']
SMTP_APP_PASSWORD_HINT = SMTP_CONFIG['app_password_hint']


# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")  # Ignore MongoDB's _id field
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

class AuthEmailRequest(BaseModel):
    email: EmailStr

class AuthCodeVerifyRequest(BaseModel):
    email: EmailStr
    code: str = Field(min_length=4, max_length=8)

class PasswordLoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)

class AuthSuccessResponse(BaseModel):
    token: str
    email: str
    name: str
    expires_at: datetime
    is_admin: bool = False

class AllowedEmailCreateRequest(BaseModel):
    email: EmailStr
    role: str = Field(default='client')
    is_active: bool = True
    membership_end: Optional[datetime] = None

class AllowedEmailUpdateRequest(BaseModel):
    role: Optional[str] = None
    is_active: Optional[bool] = None
    membership_end: Optional[datetime] = None

class CloudDataSaveRequest(BaseModel):
    payload: dict = Field(default_factory=dict)

def normalize_email(email: str) -> str:
    return email.strip().lower()

def normalize_role(role: str) -> str:
    role_value = (role or 'client').strip().lower()
    return role_value if role_value in {'admin', 'client'} else 'client'

def serialize_membership_end(value: Optional[datetime]):
    if value is None:
        return None
    if isinstance(value, str):
        return value
    return value.isoformat()

def parse_membership_end(value):
    if not value:
        return None
    if isinstance(value, datetime):
        return value
    try:
        return datetime.fromisoformat(str(value))
    except Exception:
        return None

def is_membership_active(item: Optional[dict]) -> bool:
    if not item:
        return False
    if not item.get('is_active', True):
        return False
    membership_end = parse_membership_end(item.get('membership_end'))
    if membership_end and membership_end < datetime.now(timezone.utc):
        return False
    return True

def get_allowed_email_record(email: str) -> Optional[dict]:
    normalized = normalize_email(email)
    if normalized in ALLOWED_LOGIN_EMAILS:
        return {
            'email': normalized,
            'source': 'env',
            'read_only': True,
            'created_at': None,
            'created_by': 'backend/.env',
            'role': 'admin' if normalized in ADMIN_LOGIN_EMAILS else 'client',
            'is_active': True,
            'membership_end': None,
        }
    return None

def hash_code(email: str, code: str) -> str:
    return hashlib.sha256(f"{normalize_email(email)}::{code.strip()}".encode('utf-8')).hexdigest()

def create_access_token(email: str) -> tuple[str, datetime]:
    expires_at = datetime.now(timezone.utc) + timedelta(hours=SESSION_EXPIRATION_HOURS)
    payload = {
        'sub': normalize_email(email),
        'type': 'email_otp',
        'exp': int(expires_at.timestamp()),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM), expires_at

def decode_access_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except JWTError:
        return None

def extract_bearer_token(authorization: Optional[str]) -> Optional[str]:
    if not authorization:
        return None
    scheme, _, value = authorization.partition(' ')
    if scheme.lower() != 'bearer' or not value:
        return None
    return value.strip()

def is_email_allowed(email: str) -> bool:
    normalized = normalize_email(email)
    return normalized in ALLOWED_LOGIN_EMAILS

async def get_effective_allowed_email(email: str) -> Optional[dict]:
    normalized = normalize_email(email)
    env_record = get_allowed_email_record(normalized)
    if env_record:
        return env_record
    return await store_get_allowed_db(normalized)

async def is_email_allowed_db(email: str) -> bool:
    record = await get_effective_allowed_email(email)
    return is_membership_active(record)

async def is_admin_email_db(email: str) -> bool:
    record = await get_effective_allowed_email(email)
    if not is_membership_active(record):
        return False
    return normalize_role((record or {}).get('role', 'client')) == 'admin'

def smtp_starttls_enabled() -> bool:
    if SMTP_USE_STARTTLS in {'1', 'true', 'yes', 'on'}:
        return True
    if SMTP_USE_STARTTLS in {'0', 'false', 'no', 'off'}:
        return False
    return not SMTP_SECURE_SSL and SMTP_PORT in {587, 2525}


async def store_find_latest_code(email: str):
    if USE_FILE_STORAGE:
        with _storage_lock:
            items = [item for item in _load_store().get(AUTH_CODES_COLLECTION, []) if item.get('email') == email]
        return items[-1] if items else None
    raise RuntimeError('Mongo storage path no longer used in this build.')


async def store_insert_code(record: dict):
    if USE_FILE_STORAGE:
        with _storage_lock:
            store = _load_store()
            record = {**record, "_id": str(uuid.uuid4())}
            store.setdefault(AUTH_CODES_COLLECTION, []).append(record)
            _save_store(store)
        return record
    raise RuntimeError('Mongo storage path no longer used in this build.')


async def store_delete_code(record_id: str):
    if USE_FILE_STORAGE:
        with _storage_lock:
            store = _load_store()
            store[AUTH_CODES_COLLECTION] = [item for item in store.setdefault(AUTH_CODES_COLLECTION, []) if item.get('_id') != record_id]
            _save_store(store)
        return
    raise RuntimeError('Mongo storage path no longer used in this build.')


async def store_consume_code(record_id: str):
    if USE_FILE_STORAGE:
        with _storage_lock:
            store = _load_store()
            for item in store.setdefault(AUTH_CODES_COLLECTION, []):
                if item.get('_id') == record_id:
                    item['consumed'] = True
                    item['verified_at'] = datetime.now(timezone.utc).isoformat()
                    break
            _save_store(store)
        return
    raise RuntimeError('Mongo storage path no longer used in this build.')


def _cloud_allowlist_enabled() -> bool:
    return bool(SUPABASE_URL and SUPABASE_SERVER_KEY and SUPABASE_APP_DATA_TABLE)


def _normalize_allowed_item(item: dict) -> dict:
    return {
        'email': normalize_email(str(item.get('email', ''))),
        'created_at': item.get('created_at'),
        'created_by': item.get('created_by', 'admin'),
        'role': normalize_role(item.get('role', 'client')),
        'is_active': bool(item.get('is_active', True)),
        'membership_end': item.get('membership_end'),
        'updated_at': item.get('updated_at'),
        'deleted': bool(item.get('deleted', False)),
    }


async def supabase_load_allowed_items() -> list:
    if not _cloud_allowlist_enabled():
        return []

    payload = await supabase_load_app_data(SUPABASE_ALLOWED_EMAILS_KEY)
    if not isinstance(payload, dict):
        return []

    items = payload.get('items', [])
    if not isinstance(items, list):
        return []

    clean_items = []
    seen = set()
    for raw_item in items:
        if not isinstance(raw_item, dict):
            continue
        item = _normalize_allowed_item(raw_item)
        email = item.get('email')
        if email and email not in seen:
            clean_items.append(item)
            seen.add(email)
    return clean_items


async def supabase_save_allowed_items(items: list) -> None:
    if not _cloud_allowlist_enabled():
        return

    clean_items = []
    seen = set()
    for raw_item in items:
        if not isinstance(raw_item, dict):
            continue
        item = _normalize_allowed_item(raw_item)
        email = item.get('email')
        if email and email not in seen:
            clean_items.append(item)
            seen.add(email)

    await supabase_save_app_data(SUPABASE_ALLOWED_EMAILS_KEY, {'items': clean_items})


async def store_get_allowed_db(email: str):
    normalized = normalize_email(email)

    if _cloud_allowlist_enabled():
        for item in await supabase_load_allowed_items():
            if item.get('email') == normalized:
                if item.get('deleted'):
                    return None
                return dict(item)

    if USE_FILE_STORAGE:
        with _storage_lock:
            store = _load_store()
            for item in store.get(ALLOWED_EMAILS_COLLECTION, []):
                if item.get('email') == normalized:
                    return dict(item)

    # Fallback importante: si el correo existe como fila real en public.app_user_data,
    # también se toma como registrado. Esta es la tabla que el usuario ve en Supabase.
    if await supabase_app_data_user_exists(normalized):
        return {
            'email': normalized,
            'created_at': None,
            'created_by': 'app_user_data',
            'role': 'admin' if normalized in ADMIN_LOGIN_EMAILS else 'client',
            'is_active': True,
            'membership_end': None,
            'source': 'app_user_data',
        }

    # Fallback adicional para Supabase Authentication, pero respetando tombstones
    # creados cuando el admin elimina un correo desde la app.
    if not await store_has_deleted_tombstone(normalized) and await supabase_auth_user_exists(normalized):
        return {
            'email': normalized,
            'created_at': None,
            'created_by': 'supabase_auth',
            'role': 'admin' if normalized in ADMIN_LOGIN_EMAILS else 'client',
            'is_active': True,
            'membership_end': None,
            'source': 'supabase_auth',
        }

    return None


async def store_is_allowed_db(email: str) -> bool:
    return await store_get_allowed_db(email) is not None


async def store_list_allowed_db():
    if _cloud_allowlist_enabled():
        return await supabase_load_allowed_items()

    if USE_FILE_STORAGE:
        with _storage_lock:
            return list(_load_store().get(ALLOWED_EMAILS_COLLECTION, []))
    return []


async def store_add_allowed_db(email: str, created_by: str, role: str = 'client', is_active: bool = True, membership_end: Optional[datetime] = None):
    normalized = normalize_email(email)
    new_item = {
        'email': normalized,
        'created_at': datetime.now(timezone.utc).isoformat(),
        'created_by': created_by,
        'role': normalize_role(role),
        'is_active': bool(is_active),
        'membership_end': serialize_membership_end(membership_end),
    }

    if _cloud_allowlist_enabled():
        items = await supabase_load_allowed_items()
        for item in items:
            if item.get('email') == normalized:
                item.update(new_item)
                item['deleted'] = False
                await supabase_save_allowed_items(items)
                return
        items.append(new_item)
        await supabase_save_allowed_items(items)
        return

    if USE_FILE_STORAGE:
        with _storage_lock:
            store = _load_store()
            items = store.setdefault(ALLOWED_EMAILS_COLLECTION, [])
            if not any(item.get('email') == normalized for item in items):
                items.append(new_item)
                _save_store(store)
        return

    raise HTTPException(status_code=500, detail='No hay almacenamiento configurado para guardar correos autorizados.')

async def store_update_allowed_db(email: str, updates: dict):
    normalized = normalize_email(email)
    updates = dict(updates or {})
    updates['updated_at'] = datetime.now(timezone.utc).isoformat()

    if _cloud_allowlist_enabled():
        items = await supabase_load_allowed_items()
        for item in items:
            if item.get('email') == normalized:
                item.update(updates)
                item['deleted'] = False
                await supabase_save_allowed_items(items)
                return dict(item)
        # Si el correo venía de app_user_data o Supabase Auth, al editarlo lo convertimos
        # en una entrada administrable dentro del allowlist sincronizado en Supabase.
        new_item = {
            'email': normalized,
            'created_at': datetime.now(timezone.utc).isoformat(),
            'created_by': 'admin_panel',
            'role': 'client',
            'is_active': True,
            'membership_end': None,
            'updated_at': datetime.now(timezone.utc).isoformat(),
            'deleted': False,
        }
        new_item.update(updates)
        items.append(new_item)
        await supabase_save_allowed_items(items)
        return dict(new_item)

    if USE_FILE_STORAGE:
        with _storage_lock:
            store = _load_store()
            items = store.setdefault(ALLOWED_EMAILS_COLLECTION, [])
            for item in items:
                if item.get('email') == normalized:
                    item.update(updates)
                    _save_store(store)
                    return dict(item)
    return None


async def store_delete_allowed_db(email: str) -> int:
    normalized = normalize_email(email)

    if _cloud_allowlist_enabled():
        items = await supabase_load_allowed_items()
        before = len(items)
        items = [item for item in items if item.get('email') != normalized]
        deleted = before - len(items)
        await supabase_save_allowed_items(items)
        deleted_app_data = await supabase_delete_app_data_user(normalized)
        # Guardamos tombstone para que un usuario que todavía exista en Supabase Auth
        # no vuelva a aparecer ni pueda volver a entrar por fallback.
        await store_set_deleted_tombstone(normalized)
        return max(deleted, deleted_app_data, 1)

    if USE_FILE_STORAGE:
        with _storage_lock:
            store = _load_store()
            items = store.setdefault(ALLOWED_EMAILS_COLLECTION, [])
            before = len(items)
            store[ALLOWED_EMAILS_COLLECTION] = [item for item in items if item.get('email') != normalized]
            deleted = before - len(store[ALLOWED_EMAILS_COLLECTION])
            if deleted:
                _save_store(store)
            return deleted
    return 0



async def require_active_user(authorization: Optional[str] = Header(default=None)) -> str:
    token = extract_bearer_token(authorization)
    if not token:
        raise HTTPException(status_code=401, detail='Token requerido.')

    payload = decode_access_token(token)
    if not payload or payload.get('type') != 'email_otp':
        raise HTTPException(status_code=401, detail='Token inválido.')

    email = normalize_email(payload.get('sub', ''))
    if not email or not await is_email_allowed_db(email):
        raise HTTPException(status_code=403, detail='Sesión no autorizada.')

    effective = await get_effective_allowed_email(email)
    if not is_membership_active(effective):
        raise HTTPException(status_code=403, detail='Este acceso está desactivado o vencido.')

    return email


def _looks_like_jwt(value: str) -> bool:
    return bool(value and value.startswith('eyJ'))


def supabase_headers(prefer: Optional[str] = None) -> dict:
    if not SUPABASE_URL or not SUPABASE_SERVER_KEY:
        raise HTTPException(status_code=500, detail='Supabase no está configurado en backend/.env.')

    # Legacy service_role JWT: apikey + Authorization Bearer.
    # New sb_secret_: apikey only.
    headers = {
        'apikey': SUPABASE_SERVER_KEY,
        'Content-Type': 'application/json',
    }
    if _looks_like_jwt(SUPABASE_SERVER_KEY):
        headers['Authorization'] = f'Bearer {SUPABASE_SERVER_KEY}'
    if prefer:
        headers['Prefer'] = prefer
    return headers


def supabase_rest_url(path: str) -> str:
    return f"{SUPABASE_URL}/rest/v1/{path.lstrip('/')}"


def supabase_auth_headers() -> dict:
    """Headers for Supabase Auth Admin API. This is backend-only."""
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        return {}
    return {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': f'Bearer {SUPABASE_SERVICE_ROLE_KEY}',
        'Content-Type': 'application/json',
    }


def _extract_supabase_auth_users(payload) -> list:
    if isinstance(payload, dict):
        users = payload.get('users') or payload.get('data') or []
        return users if isinstance(users, list) else []
    if isinstance(payload, list):
        return payload
    return []


async def supabase_auth_user_exists(email: str) -> bool:
    """
    Fallback de acceso: si el correo existe en Supabase Authentication > Users,
    la app lo reconoce como registrado aunque no esté dentro del allowlist interno.
    """
    normalized = normalize_email(email)
    if not normalized or not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        return False

    headers = supabase_auth_headers()
    if not headers:
        return False

    try:
        response = requests.get(
            f"{SUPABASE_URL}/auth/v1/admin/users",
            headers=headers,
            params={'email': normalized, 'per_page': '1000'},
            timeout=20,
        )
        if response.status_code < 400:
            for user in _extract_supabase_auth_users(response.json() if response.text else {}):
                if normalize_email(str(user.get('email', ''))) == normalized:
                    return True
    except Exception:
        pass

    for page in range(1, 11):
        try:
            response = requests.get(
                f"{SUPABASE_URL}/auth/v1/admin/users",
                headers=headers,
                params={'page': str(page), 'per_page': '1000'},
                timeout=20,
            )
            if response.status_code >= 400:
                return False
            users = _extract_supabase_auth_users(response.json() if response.text else {})
            if not users:
                return False
            for user in users:
                if normalize_email(str(user.get('email', ''))) == normalized:
                    return True
        except Exception:
            return False
    return False


async def supabase_auth_list_user_emails() -> list:
    """Lista correos visibles en Supabase Authentication para mostrarlos en el panel admin."""
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        return []
    headers = supabase_auth_headers()
    emails = []
    seen = set()
    for page in range(1, 11):
        try:
            response = requests.get(
                f"{SUPABASE_URL}/auth/v1/admin/users",
                headers=headers,
                params={'page': str(page), 'per_page': '1000'},
                timeout=20,
            )
            if response.status_code >= 400:
                break
            users = _extract_supabase_auth_users(response.json() if response.text else {})
            if not users:
                break
            for user in users:
                email = normalize_email(str(user.get('email', '')))
                if email and email not in seen:
                    emails.append(email)
                    seen.add(email)
        except Exception:
            break
    return emails


async def supabase_list_app_data_user_emails() -> list:
    """Lista user_email existentes en public.app_user_data para que el admin pueda administrarlos."""
    if not _cloud_allowlist_enabled():
        return []
    try:
        response = requests.get(
            supabase_rest_url(SUPABASE_APP_DATA_TABLE),
            headers=supabase_headers(),
            params={
                'select': 'user_email',
                'user_email': 'neq.' + SUPABASE_ALLOWED_EMAILS_KEY,
                'limit': '1000',
            },
            timeout=20,
        )
    except requests.RequestException:
        return []
    if response.status_code >= 400:
        return []
    rows = response.json() if response.text else []
    emails = []
    seen = set()
    for row in rows if isinstance(rows, list) else []:
        email = normalize_email(str(row.get('user_email', '')))
        if email and email not in seen:
            emails.append(email)
            seen.add(email)
    return emails


async def supabase_app_data_user_exists(email: str) -> bool:
    normalized = normalize_email(email)
    if not normalized or not _cloud_allowlist_enabled():
        return False
    try:
        response = requests.get(
            supabase_rest_url(SUPABASE_APP_DATA_TABLE),
            headers=supabase_headers(),
            params={
                'user_email': f'eq.{normalized}',
                'select': 'user_email',
                'limit': '1',
            },
            timeout=20,
        )
    except requests.RequestException:
        return False
    if response.status_code >= 400:
        return False
    rows = response.json() if response.text else []
    return bool(rows)


async def supabase_delete_app_data_user(email: str) -> int:
    """Elimina de public.app_user_data la fila del usuario para sincronizar el borrado del panel."""
    normalized = normalize_email(email)
    if not normalized or not _cloud_allowlist_enabled():
        return 0
    try:
        response = requests.delete(
            supabase_rest_url(SUPABASE_APP_DATA_TABLE),
            headers=supabase_headers(),
            params={'user_email': f'eq.{normalized}'},
            timeout=20,
        )
    except requests.RequestException as exc:
        raise HTTPException(status_code=502, detail=f'No pude eliminar ese correo en Supabase: {exc}') from exc
    if response.status_code >= 400:
        raise HTTPException(status_code=502, detail=f'Supabase rechazó el borrado: {response.text[:400]}')
    return 1


async def store_has_deleted_tombstone(email: str) -> bool:
    normalized = normalize_email(email)
    if _cloud_allowlist_enabled():
        for item in await supabase_load_allowed_items():
            if item.get('email') == normalized and item.get('deleted'):
                return True
    if USE_FILE_STORAGE:
        with _storage_lock:
            for item in _load_store().get(ALLOWED_EMAILS_COLLECTION, []):
                if item.get('email') == normalized and item.get('deleted'):
                    return True
    return False


async def store_set_deleted_tombstone(email: str, deleted_by: str = 'admin') -> None:
    normalized = normalize_email(email)
    tombstone = {
        'email': normalized,
        'created_at': datetime.now(timezone.utc).isoformat(),
        'created_by': deleted_by,
        'role': 'client',
        'is_active': False,
        'membership_end': None,
        'updated_at': datetime.now(timezone.utc).isoformat(),
        'deleted': True,
    }
    if _cloud_allowlist_enabled():
        items = await supabase_load_allowed_items()
        found = False
        for item in items:
            if item.get('email') == normalized:
                item.update(tombstone)
                found = True
                break
        if not found:
            items.append(tombstone)
        await supabase_save_allowed_items(items)
        return
    if USE_FILE_STORAGE:
        with _storage_lock:
            store = _load_store()
            items = store.setdefault(ALLOWED_EMAILS_COLLECTION, [])
            found = False
            for item in items:
                if item.get('email') == normalized:
                    item.update(tombstone)
                    found = True
                    break
            if not found:
                items.append(tombstone)
            _save_store(store)


async def supabase_load_app_data(email: str):
    try:
        response = requests.get(
            supabase_rest_url(SUPABASE_APP_DATA_TABLE),
            headers=supabase_headers(),
            params={
                'user_email': f'eq.{email}',
                'select': 'payload,updated_at',
                'limit': '1',
            },
            timeout=20,
        )
    except requests.RequestException as exc:
        raise HTTPException(status_code=502, detail=f'No pude conectar con Supabase: {exc}') from exc

    if response.status_code >= 400:
        raise HTTPException(status_code=502, detail=f'Supabase rechazó la lectura: {response.text[:400]}')

    rows = response.json() if response.text else []
    if not rows:
        return None
    return rows[0].get('payload')


async def supabase_save_app_data(email: str, payload: dict):
    row = {
        'user_email': email,
        'payload': payload or {},
        'updated_at': datetime.now(timezone.utc).isoformat(),
    }

    try:
        response = requests.post(
            supabase_rest_url(SUPABASE_APP_DATA_TABLE),
            headers=supabase_headers('resolution=merge-duplicates'),
            params={'on_conflict': 'user_email'},
            json=row,
            timeout=20,
        )
    except requests.RequestException as exc:
        raise HTTPException(status_code=502, detail=f'No pude conectar con Supabase: {exc}') from exc

    if response.status_code >= 400:
        raise HTTPException(status_code=502, detail=f'Supabase rechazó el guardado: {response.text[:400]}')

    return True

async def require_admin(authorization: Optional[str] = Header(default=None)) -> str:
    token = extract_bearer_token(authorization)
    if not token:
        raise HTTPException(status_code=401, detail='Token requerido.')

    payload = decode_access_token(token)
    if not payload or payload.get('type') != 'email_otp':
        raise HTTPException(status_code=401, detail='Token inválido.')

    email = normalize_email(payload.get('sub', ''))
    if not email or not await is_email_allowed_db(email):
        raise HTTPException(status_code=403, detail='Sesión no autorizada.')

    if not await is_admin_email_db(email):
        raise HTTPException(status_code=403, detail='Solo un administrador puede gestionar los correos permitidos.')

    return email

def send_verification_email(recipient: str, code: str) -> None:
    subject = 'Tu código de acceso a la app'
    text_body = (
        f"Hola,\n\n"
        f"Tu código de acceso es: {code}\n\n"
        f"Este código vence en {OTP_EXPIRATION_MINUTES} minutos. "
        f"Si no solicitaste este acceso, ignora este mensaje."
    )

    delivery = get_runtime_email_delivery_config()
    errors = []

    for provider in delivery['providers']:
        provider_type = provider.get('type')

        if provider_type == 'resend' and provider.get('is_ready'):
            try:
                send_email_via_resend(recipient, subject, text_body)
                return
            except Exception as exc:
                errors.append(f"resend: {exc}")
                continue

        if provider_type == 'smtp':
            try:
                send_email_via_smtp_message(recipient, subject, text_body)
                return
            except Exception as exc:
                errors.append(f"smtp: {exc}")
                continue

    joined = ' | '.join(errors).strip() or 'No hay ningún proveedor listo para enviar correos.'
    raise RuntimeError(
        'No pude enviar el código por correo. '
        'La app ya quedó preparada para envío automático con Resend o SMTP, '
        'pero falta conectar al menos un emisor real del sistema. '
        + joined
    )

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.get('/auth/health')
async def auth_health_check():
    runtime_smtp = get_runtime_smtp_config()
    runtime_delivery = get_runtime_email_delivery_config()
    resend_provider = next((provider for provider in runtime_delivery.get('providers', []) if provider.get('type') == 'resend'), None)
    return {
        'ok': True,
        'api_base': '/api',
        'bootstrap_admin_email': DEFAULT_BOOTSTRAP_ADMIN_EMAIL,
        'direct_admin_password_enabled': True,
        'allowed_env_count': len(ALLOWED_LOGIN_EMAILS),
        'admin_env_count': len(ADMIN_LOGIN_EMAILS),
        'email_delivery': {
            'preferred_order': runtime_delivery.get('preferred_order', []),
            'has_ready_provider': runtime_delivery.get('has_ready_provider', False),
        },
        'resend': {
            'configured': bool(resend_provider),
            'ready': bool(resend_provider and resend_provider.get('is_ready')),
            'from_email': (resend_provider or {}).get('from_email'),
            'from_name': (resend_provider or {}).get('from_name'),
            'api_base': (resend_provider or {}).get('api_base'),
        },
        'smtp': {
            'configured': bool(runtime_smtp.get('host') and runtime_smtp.get('from_email')),
            'host': runtime_smtp.get('host'),
            'port': runtime_smtp.get('port'),
            'secure_ssl': runtime_smtp.get('secure_ssl'),
            'use_starttls': runtime_smtp.get('use_starttls'),
            'requires_auth': runtime_smtp.get('require_auth'),
            'from_email': runtime_smtp.get('from_email'),
            'username': runtime_smtp.get('username'),
            'provider_key': runtime_smtp.get('provider_key') or None,
            'config_source': runtime_smtp.get('source', 'env'),
            'password_ready': bool(runtime_smtp.get('password')),
            'password_is_placeholder': runtime_smtp.get('password_is_placeholder', False),
        },
        'database': {
            'engine': 'supabase' if SUPABASE_URL and SUPABASE_SERVER_KEY else 'local_file',
            'supabase_url': SUPABASE_URL or None,
            'app_data_table': SUPABASE_APP_DATA_TABLE,
            'app_data_ready': bool(SUPABASE_URL and SUPABASE_SERVER_KEY),
            'using_service_role': bool(SUPABASE_SERVICE_ROLE_KEY),
            'server_key_source': 'service_role' if SUPABASE_SERVICE_ROLE_KEY else ('anon' if SUPABASE_ANON_KEY else 'missing'),
            'server_key_prefix': (SUPABASE_SERVER_KEY[:12] + '...') if SUPABASE_SERVER_KEY else None,
            'env_files_checked': [str(path) for path in ENV_CANDIDATE_FILES],
            'backend_root': str(ROOT_DIR),
        },
    }

@api_router.get('/health')
async def api_health_check():
    return {
        'ok': True,
        'database': {
            'engine': 'supabase' if SUPABASE_URL and SUPABASE_SERVER_KEY else 'local_file',
            'supabase_url': SUPABASE_URL or None,
            'app_data_table': SUPABASE_APP_DATA_TABLE,
            'app_data_ready': bool(SUPABASE_URL and SUPABASE_SERVER_KEY),
            'using_service_role': bool(SUPABASE_SERVICE_ROLE_KEY),
            'server_key_source': 'service_role' if SUPABASE_SERVICE_ROLE_KEY else ('anon' if SUPABASE_ANON_KEY else 'missing'),
            'server_key_prefix': (SUPABASE_SERVER_KEY[:12] + '...') if SUPABASE_SERVER_KEY else None,
            'env_files_checked': [str(path) for path in ENV_CANDIDATE_FILES],
            'backend_root': str(ROOT_DIR),
        }
    }

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    # Convert to dict and serialize datetime to ISO string for MongoDB
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    if USE_FILE_STORAGE:
        with _storage_lock:
            store = _load_store()
            store.setdefault('status_checks', []).append(doc)
            _save_store(store)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    # Exclude MongoDB's _id field from the query results
    status_checks = _load_store().get('status_checks', []) if USE_FILE_STORAGE else []
    
    # Convert ISO string timestamps back to datetime objects
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks

@api_router.post('/auth/request-code')
async def request_login_code(payload: AuthEmailRequest):
    email = normalize_email(str(payload.email))

    # El administrador principal siempre puede entrar con la clave directa, incluso si la allowlist no se cargó todavía.
    if email != normalize_email(DEFAULT_BOOTSTRAP_ADMIN_EMAIL):
        allowed_record = await get_effective_allowed_email(email)
        if not allowed_record:
            raise HTTPException(status_code=403, detail='Este correo no está registrado en la plataforma. Verifica con el administrador para que lo agregue antes de solicitar un código.')
        if not is_membership_active(allowed_record):
            raise HTTPException(status_code=403, detail='Este acceso está desactivado o vencido.')

    now = datetime.now(timezone.utc)
    latest = await store_find_latest_code(email)
    if latest and isinstance(latest.get('created_at'), str):
        latest['created_at'] = datetime.fromisoformat(latest['created_at'])

    if latest and (now - latest['created_at']).total_seconds() < OTP_COOLDOWN_SECONDS:
        raise HTTPException(status_code=429, detail=f'Espera {OTP_COOLDOWN_SECONDS} segundos antes de pedir otro código.')

    code = f"{random.randint(0, 999999):06d}"
    expires_at = now + timedelta(minutes=OTP_EXPIRATION_MINUTES)

    code_record = await store_insert_code({
        'email': email,
        'code_hash': hash_code(email, code),
        'created_at': now.isoformat(),
        'expires_at': expires_at.isoformat(),
        'consumed': False,
    })

    try:
        send_verification_email(email, code)
    except Exception as exc:
        await store_delete_code(code_record.get('_id'))
        logger.exception('OTP email error')
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return {'ok': True, 'email': email, 'expires_in_minutes': OTP_EXPIRATION_MINUTES}


@api_router.post('/auth/login-password', response_model=AuthSuccessResponse)
async def login_with_password(payload: PasswordLoginRequest):
    try:
        email = normalize_email(str(payload.email))
        password = payload.password.strip()

        if email != normalize_email(DEFAULT_BOOTSTRAP_ADMIN_EMAIL):
            raise HTTPException(status_code=403, detail='Este acceso directo solo está habilitado para el administrador principal.')

        if not await is_admin_email_db(email):
            raise HTTPException(status_code=403, detail='Ese correo no tiene permisos de administrador o está inactivo.')

        if password != DEFAULT_ADMIN_PASSWORD:
            raise HTTPException(status_code=401, detail='La clave no es válida.')

        # El administrador principal siempre puede entrar con la clave directa, incluso si la allowlist no se cargó todavía.
        if email != normalize_email(DEFAULT_BOOTSTRAP_ADMIN_EMAIL) and not await is_email_allowed_db(email):
            raise HTTPException(status_code=403, detail='Este correo no está autorizado para entrar a la app.')

        token, session_expires_at = create_access_token(email)
        return AuthSuccessResponse(token=token, email=email, name=email.split('@')[0], expires_at=session_expires_at, is_admin=True)
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception('Direct admin password login error')
        raise HTTPException(status_code=500, detail=f'Falló el acceso admin directo: {exc}') from exc

@api_router.post('/auth/verify-code', response_model=AuthSuccessResponse)
async def verify_login_code(payload: AuthCodeVerifyRequest):
    email = normalize_email(str(payload.email))
    code = payload.code.strip()

    record = await store_find_latest_code(email)
    if not record:
        raise HTTPException(status_code=404, detail='Primero solicita un código de acceso.')

    created_at = datetime.fromisoformat(record['created_at']) if isinstance(record.get('created_at'), str) else record.get('created_at')
    expires_at = datetime.fromisoformat(record['expires_at']) if isinstance(record.get('expires_at'), str) else record.get('expires_at')

    if record.get('consumed'):
        raise HTTPException(status_code=400, detail='Ese código ya fue usado. Solicita uno nuevo.')

    if not expires_at or expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail='El código expiró. Solicita uno nuevo.')

    if record.get('code_hash') != hash_code(email, code):
        raise HTTPException(status_code=400, detail='El código no es válido.')

    await store_consume_code(record['_id'])

    token, session_expires_at = create_access_token(email)
    return AuthSuccessResponse(token=token, email=email, name=email.split('@')[0], expires_at=session_expires_at, is_admin=await is_admin_email_db(email))

@api_router.get('/auth/session')
async def get_auth_session(authorization: Optional[str] = Header(default=None)):
    token = extract_bearer_token(authorization)
    if not token:
        raise HTTPException(status_code=401, detail='Token requerido.')

    payload = decode_access_token(token)
    if not payload or payload.get('type') != 'email_otp':
        raise HTTPException(status_code=401, detail='Token inválido.')

    email = normalize_email(payload.get('sub', ''))
    if not email or not await is_email_allowed_db(email):
        raise HTTPException(status_code=403, detail='Sesión no autorizada.')

    exp = payload.get('exp')
    expires_at = datetime.fromtimestamp(exp, tz=timezone.utc) if exp else datetime.now(timezone.utc)
    effective = await get_effective_allowed_email(email)
    membership_end = effective.get('membership_end') if effective else None
    return {'email': email, 'name': email.split('@')[0], 'expires_at': expires_at, 'is_admin': await is_admin_email_db(email), 'role': (effective or {}).get('role', 'client'), 'is_active': (effective or {}).get('is_active', True), 'membership_end': membership_end}

@api_router.get('/cloud/data')
async def load_user_cloud_data(user_email: str = Depends(require_active_user)):
    payload = await supabase_load_app_data(user_email)
    return {'ok': True, 'email': user_email, 'payload': payload}


@api_router.put('/cloud/data')
async def save_user_cloud_data(payload: CloudDataSaveRequest, user_email: str = Depends(require_active_user)):
    await supabase_save_app_data(user_email, payload.payload)
    return {'ok': True, 'email': user_email}


@api_router.get('/auth/admin/allowed-emails')
async def list_allowed_emails(_: str = Depends(require_admin)):
    db_entries = [item for item in await store_list_allowed_db() if not item.get('deleted')]
    db_map = {normalize_email(item.get('email', '')): item for item in db_entries if item.get('email')}

    merged = []
    existing = set()

    for email in sorted(ALLOWED_LOGIN_EMAILS):
        env_record = get_allowed_email_record(email) or {}
        is_admin = email in ADMIN_LOGIN_EMAILS
        merged.append({
            'email': email,
            'source': 'env',
            'read_only': True if is_admin else False,
            'created_at': None,
            'created_by': 'backend/.env',
            'role': normalize_role(env_record.get('role', 'client')),
            'is_active': True,
            'membership_end': env_record.get('membership_end'),
            'access_granted': True,
        })
        existing.add(email)

    for email, item in sorted(db_map.items()):
        if email in existing:
            continue
        is_admin = email in ADMIN_LOGIN_EMAILS or normalize_role(item.get('role', 'client')) == 'admin'
        merged.append({
            'email': email,
            'source': 'db',
            'read_only': True if is_admin else False,
            'created_at': item.get('created_at'),
            'created_by': item.get('created_by', 'admin'),
            'role': normalize_role(item.get('role', 'client')),
            'is_active': bool(item.get('is_active', True)),
            'membership_end': item.get('membership_end'),
            'access_granted': is_membership_active(item),
        })
        existing.add(email)

    for email in sorted(await supabase_list_app_data_user_emails()):
        if email in existing or await store_has_deleted_tombstone(email):
            continue
        is_admin = email in ADMIN_LOGIN_EMAILS
        merged.append({
            'email': email,
            'source': 'app_user_data',
            'read_only': True if is_admin else False,
            'created_at': None,
            'created_by': 'public.app_user_data',
            'role': 'admin' if is_admin else 'client',
            'is_active': True,
            'membership_end': None,
            'access_granted': True,
        })
        existing.add(email)

    for email in sorted(await supabase_auth_list_user_emails()):
        if email in existing or await store_has_deleted_tombstone(email):
            continue
        is_admin = email in ADMIN_LOGIN_EMAILS
        merged.append({
            'email': email,
            'source': 'supabase_auth',
            'read_only': True if is_admin else False,
            'created_at': None,
            'created_by': 'Supabase Authentication',
            'role': 'admin' if is_admin else 'client',
            'is_active': True,
            'membership_end': None,
            'access_granted': True,
        })
        existing.add(email)

    return {
        'items': merged,
        'admin_mode': 'env_fallback' if not ADMIN_LOGIN_EMAILS else 'strict',
        'can_edit_env_items': False
    }

@api_router.post('/auth/admin/allowed-emails')
async def add_allowed_email(payload: AllowedEmailCreateRequest, admin_email: str = Depends(require_admin)):
    email = normalize_email(str(payload.email))

    if email in ALLOWED_LOGIN_EMAILS:
        return {'ok': True, 'email': email, 'source': 'env', 'message': 'Ese correo ya existe en los accesos autorizados.'}

    existing = await store_get_allowed_db(email)
    if existing:
        return {'ok': True, 'email': email, 'source': 'db', 'message': 'Ese correo ya existe en los accesos autorizados.'}

    await store_add_allowed_db(email, admin_email, normalize_role(payload.role), payload.is_active, payload.membership_end)

    return {'ok': True, 'email': email, 'source': 'db', 'message': 'Correo agregado correctamente.'}

@api_router.patch('/auth/admin/allowed-emails/{email}')
async def update_allowed_email(email: str, payload: AllowedEmailUpdateRequest, _: str = Depends(require_admin)):
    normalized = normalize_email(email)
    if normalized in ADMIN_LOGIN_EMAILS:
        raise HTTPException(status_code=400, detail='El correo administrador principal queda protegido y no se edita desde el panel.')

    existing = await store_get_allowed_db(normalized)
    if not existing:
        raise HTTPException(status_code=404, detail='No encontré ese correo en la lista administrable.')

    updates = {}
    if payload.role is not None:
        updates['role'] = normalize_role(payload.role)
    if payload.is_active is not None:
        updates['is_active'] = bool(payload.is_active)
    if 'membership_end' in payload.model_fields_set:
        updates['membership_end'] = serialize_membership_end(payload.membership_end)

    updated = await store_update_allowed_db(normalized, updates)
    return {'ok': True, 'email': normalized, 'item': updated}

@api_router.delete('/auth/admin/allowed-emails/{email}')
async def delete_allowed_email(email: str, _: str = Depends(require_admin)):
    normalized = normalize_email(email)
    if normalized in ADMIN_LOGIN_EMAILS:
        raise HTTPException(status_code=400, detail='El correo administrador principal queda protegido y no se elimina desde el panel.')

    deleted_count = await store_delete_allowed_db(normalized)
    if deleted_count == 0:
        raise HTTPException(status_code=404, detail='No encontré ese correo en la lista administrable.')

    return {'ok': True, 'email': normalized}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    # No hay cliente persistente que cerrar; las llamadas a Supabase usan requests por petición.
    return None