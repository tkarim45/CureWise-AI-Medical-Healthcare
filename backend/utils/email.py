import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging
from config.settings import settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def send_confirmation_email(
    recipient_email: str,
    patient_username: str,
    doctor_username: str,
    department_name: str,
    appointment_date: str,
    start_time: str,
    hospital_id: str,
):
    try:
        # Create email message
        msg = MIMEMultipart()
        msg["From"] = settings.EMAIL_SENDER
        msg["To"] = recipient_email
        msg["Subject"] = "Appointment Confirmation"

        # Email body
        body = f"""
        Dear {patient_username},

        Your appointment has been successfully booked!

        Details:
        - Doctor: {doctor_username}
        - Department: {department_name}
        - Date: {appointment_date}
        - Time: {start_time}
        - Hospital ID: {hospital_id}

        Please arrive 10 minutes early. If you need to cancel or reschedule, contact us.

        Best regards,
        Your Healthcare Team
        """
        msg.attach(MIMEText(body, "plain"))

        # Connect to SMTP server
        with smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.EMAIL_SENDER, settings.EMAIL_PASSWORD)
            server.sendmail(settings.EMAIL_SENDER, recipient_email, msg.as_string())

        logger.info(f"Confirmation email sent to {recipient_email}")
    except Exception as e:
        logger.error(f"Failed to send email to {recipient_email}: {str(e)}")
