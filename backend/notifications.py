import logging

logger = logging.getLogger(__name__)

async def send_push_notification(user_id: int, title: str, body: str):
    """
    Mock function to send push notifications.
    In the future, this will integrate with Expo Push Notifications or Firebase.
    """
    logger.info(f"PUSH NOTIFICATION [User {user_id}]: {title} - {body}")
    print(f"PUSH NOTIFICATION [User {user_id}]: {title} - {body}")
