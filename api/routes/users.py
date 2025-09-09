from flask import Blueprint, request, jsonify, current_app
from api.extensions import mysql
from api.util.db_util import change_opt_in_status

users_bp = Blueprint('users', __name__)

# Route to change fieldStudyOptIn status for a user
@users_bp.route('/users/changeFieldStudyOptInStatus', methods=['POST'])
def change_opt_in_status_route():
	data = request.get_json()
	user_id = data.get('userID')
	opt_in = data.get('fieldStudyOptIn')
	if user_id is None or opt_in is None:
		return jsonify({'error': 'userID and fieldStudyOptIn are required'}), 400
	try:
		cursor = mysql.connection.cursor()
		change_opt_in_status(user_id, opt_in, cursor)
		cursor.close()
		return jsonify({'message': "Status updated successfully"}), 200
	except Exception as e:
		current_app.logger.error(f"Error changing opt-in status: {e}", exc_info=True)
		return jsonify({'error': str(e)}), 500
