from flask import Blueprint, request, jsonify, current_app
import difflib
from datetime import datetime
from api.extensions import mysql
from api.util.db_util import (
    change_opt_in_status, 
    get_field_study_opt_in_status,
    get_codefile,
    add_codefile,
    update_codefile,
    add_codechanges,
    check_if_user_exists
)

users_bp = Blueprint('users', __name__)

# GET route to retrieve user's opt-in status and timestamp
@users_bp.route('/users/getFieldStudyOptInStatus/<int:user_id>', methods=['GET'])
def get_opt_in_status_route(user_id):
	try:
		cursor = mysql.connection.cursor()
		result = get_field_study_opt_in_status(user_id, cursor)
		cursor.close()
		if result is None:
			return jsonify({'error': 'User not found'}), 404
		return jsonify({
			'fieldStudyOptIn': True if result[0] == 1 else False,
			'fieldStudyOptInAt': result[1]
		}), 200
	except Exception as e:
		current_app.logger.error(f"Error retrieving opt-in status: {e}", exc_info=True)
		return jsonify({'error': str(e)}), 500

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

# Route to track code changes
@users_bp.route('/users/codeChange', methods=['POST'])
def code_change_route():
	data = request.get_json()
	user_id = data.get('userID')
	filename = data.get('filename')
	content = data.get('content')
	
	# Validate required fields
	if user_id is None or filename is None or content is None:
		return jsonify({'error': 'userID, filename, and content are required'}), 400
	
	# Validate file size (1MB limit)
	if len(content.encode('utf-8')) > 1024 * 1024:
		return jsonify({'error': 'File content exceeds 1MB limit'}), 400
	
	try:
		cursor = mysql.connection.cursor()
		
		# Check if user exists
		if not check_if_user_exists(user_id, cursor):
			cursor.close()
			return jsonify({'error': 'User not found'}), 404
		
		# Check if file exists for this user
		existing_file = get_codefile(user_id, filename, cursor)
		
		if existing_file is None:
			# New file - add to codefiles table
			file_id = add_codefile(user_id, filename, content, cursor)
			cursor.close()
			return jsonify({
				'message': 'New code file added successfully',
				'isNewFile': True,
				'fileID': file_id
			}), 201
		else:
			# Existing file - create diff and update
			file_id = existing_file[0]  # uid is first column
			current_content = existing_file[4]  # currentContent is 5th column
			last_modified = existing_file[6]  # last_modified is 7th column
			
			if current_content.strip() == content.strip():
				cursor.close()
				return jsonify({
					'message': 'No meaningful changes made, file not tracked',
					'isNewFile': False,
					'fileID': file_id,
					'diffSize': 0
				}), 200

			# Generate unified diff with timestamps
			current_time = datetime.now()
			
			diff_lines = list(difflib.unified_diff(
				current_content.splitlines(keepends=True),
				content.splitlines(keepends=True),
				fromfile=f"a/{filename}",
				tofile=f"b/{filename}",
				fromfiledate=str(last_modified),
				tofiledate=str(current_time),
				n=3
			))
			diff_text = ''.join(diff_lines)
			
			# Add code change entry
			add_codechanges(file_id, diff_text, cursor)
			
			# Update current content
			update_codefile(file_id, content, cursor)
			
			cursor.close()
			return jsonify({
				'message': 'Code change tracked successfully',
				'isNewFile': False,
				'fileID': file_id,
				'diffSize': len(diff_text)
			}), 200
			
	except Exception as e:
		current_app.logger.error(f"Error tracking code change: {e}", exc_info=True)
		return jsonify({'error': str(e)}), 500
