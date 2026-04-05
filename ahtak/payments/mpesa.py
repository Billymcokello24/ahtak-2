"""M-Pesa STK Push (Lipa Na M-Pesa Online) integration."""
import base64
import json
import logging
from datetime import datetime
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

from django.conf import settings

logger = logging.getLogger(__name__)

SANDBOX_BASE = "https://sandbox.safaricom.co.ke"
PRODUCTION_BASE = "https://api.safaricom.co.ke"


def _get_base_url():
    return PRODUCTION_BASE if getattr(settings, "MPESA_ENV", "sandbox") == "production" else SANDBOX_BASE


def get_access_token():
    """Get OAuth access token from Safaricom."""
    consumer_key = getattr(settings, "MPESA_CONSUMER_KEY", "") or ""
    consumer_secret = getattr(settings, "MPESA_CONSUMER_SECRET", "") or ""
    if not consumer_key or not consumer_secret:
        raise ValueError("MPESA_CONSUMER_KEY and MPESA_CONSUMER_SECRET must be set")

    credentials = base64.b64encode(f"{consumer_key}:{consumer_secret}".encode()).decode()
    url = f"{_get_base_url()}/oauth/v1/generate?grant_type=client_credentials"
    req = Request(url, headers={"Authorization": f"Basic {credentials}"}, method="GET")
    with urlopen(req, timeout=30) as resp:
        data = json.loads(resp.read().decode())
    return data.get("access_token", "")


def stk_push(phone_number: str, amount: float, account_reference: str, transaction_desc: str) -> dict:
    """
    Initiate M-Pesa STK push. Returns response with CheckoutRequestID on success.
    """
    token = get_access_token()
    shortcode = getattr(settings, "MPESA_SHORTCODE", "") or ""
    passkey = getattr(settings, "MPESA_PASSKEY", "") or ""
    callback_url = getattr(settings, "MPESA_CALLBACK_URL", "") or ""

    if not all([shortcode, passkey, callback_url]):
        raise ValueError("MPESA_SHORTCODE, MPESA_PASSKEY, MPESA_CALLBACK_URL must be set")

    # Format phone: 254XXXXXXXXX
    phone = str(phone_number).strip().replace(" ", "")
    if phone.startswith("0"):
        phone = "254" + phone[1:]
    elif not phone.startswith("254"):
        phone = "254" + phone[-9:]

    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    password_str = f"{shortcode}{passkey}{timestamp}"
    password = base64.b64encode(password_str.encode()).decode()

    payload = {
        "BusinessShortCode": shortcode,
        "Password": password,
        "Timestamp": timestamp,
        "TransactionType": "CustomerPayBillOnline",
        "Amount": int(round(amount, 0)),
        "PartyA": phone,
        "PartyB": shortcode,
        "PhoneNumber": phone,
        "CallBackURL": callback_url,
        "AccountReference": account_reference[:12],
        "TransactionDesc": (transaction_desc or "Payment")[:13],
    }

    url = f"{_get_base_url()}/mpesa/stkpush/v1/processrequest"
    req = Request(
        url,
        data=json.dumps(payload).encode(),
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    with urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode())
