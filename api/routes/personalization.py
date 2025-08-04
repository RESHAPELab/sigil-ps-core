from flask import Blueprint, jsonify, request, current_app
from api.extensions import mysql
from api.util.db_util import make_connection, get_personalization, update_personalization

personalization_bp = Blueprint('personalization', __name__)

@personalization_bp.route('/personalization/<int:user_id>', methods=['GET'])
def personalization_get(user_id):
    cursor = make_connection(mysql)
    try:
        result = get_personalization(user_id, cursor)
    except Exception as e:
        cursor.close()

        current_app.logger.error("Error fetching personalization", exc_info=True)
        return jsonify({'message': 'Something went wrong'}), 500

    cursor.close()
    if result is None:
        current_app.logger.info(f"User {user_id} not found")
        return jsonify({'message': 'User not found'}), 404

    return jsonify({'personalization': {"personalizedPrompt": result}})

@personalization_bp.route('/personalization/<int:user_id>', methods=['PUT'])
def personalization_update(user_id):
    data = request.get_json()
    new_personalization = data.get('personalization')["personalizedPrompt"]

    cursor = make_connection(mysql)
    try:
        update_personalization(user_id, new_personalization, cursor)
    except Exception as e:
        cursor.close()

        current_app.logger.error("Error updating personalization", exc_info=True)
        return jsonify({'message': 'Something went wrong'}), 500

    cursor.close()
    return jsonify({'message': 'Personalization updated successfully'})