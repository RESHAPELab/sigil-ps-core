from flask import Blueprint, request, jsonify, current_app
from api.extensions import mysql
from api.util.tiamat_db_functions import *
from llm.tiamat import Tiamat

feedback_bp = Blueprint('feedback', __name__)
chat = Tiamat()

@feedback_bp.route('/feedback', methods=['POST'])
def get_feedback():
    data = request.get_json()
    user_id = data.get('id')
    message = data.get('message')
    code = data.get('code') or ''
    response = data.get('response')
    rating = data.get('rating')
    reason = data.get('reason')
    personalize = data.get('personalize') or False

    if not message or not user_id or not response or rating is None or not reason:
        current_app.logger.error("Missing required data in feedback request")
        return jsonify({'message': 'Some required data is missing'}), 400

    cursor = make_connection(mysql)

    if not check_if_user_exists(user_id, cursor):
        add_user(user_id, cursor)

    if check_if_interaction_exists(user_id, message, response, code, cursor):
        modify_interaction_rating(message, response, code, rating, reason, cursor)
    else:
        add_feedback(cursor, user_id, message, code, response, rating, reason)

    if personalize:
        interactions = get_users_interactions(user_id, cursor)
        existing_personalization = get_personalization(user_id, cursor) or ""
        result = chat.get_personalization_from_feedback(interactions, existing_personalization)
        update_personalization(user_id, result.personalization, cursor)

    cursor.close()
    return jsonify({'rating': rating, 'reason': reason, 'message': message, 'response': response, 'code': code})