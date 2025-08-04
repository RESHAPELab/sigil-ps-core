from flask import Blueprint, request, jsonify, current_app
from api.util.db_util import get_personas, add_persona, update_persona, delete_persona, get_persona, make_connection
from api.extensions import mysql

personas_bp = Blueprint('personas', __name__)

@personas_bp.route('/personas', methods=['GET'])
def get_personas_route():
    cursor = None

    try:
        cursor = make_connection(mysql)
        personas = get_personas(cursor)
        cursor.close()

        personas = list(personas)
        for i in range(len(personas)):
            personas[i] = {"id": personas[i][0], "name": personas[i][1], "description": personas[i][2], "prompt": personas[i][3]}

        return jsonify(personas)
    except Exception as e:
        if cursor:
            cursor.close()

        current_app.logger.error("Error fetching personas", exc_info=True)
        return jsonify({"error": str(e)}), 500

@personas_bp.route('/personas', methods=['POST'])
def create_persona_route():
    cursor = None

    try:
        data = request.json
        name = data.get('name')
        description = data.get('description')
        prompt = data.get('prompt')

        if not name or not description or not prompt:
            return jsonify({"error": "Missing required fields"}), 400

        cursor = make_connection(mysql)
        add_persona(name, description, prompt, cursor)
        cursor.close()

        return jsonify({"message": "Persona created"}), 201
    except Exception as e:
        if cursor:
            cursor.close()

        current_app.logger.error("Error creating persona", exc_info=True)
        return jsonify({"error": str(e)}), 500

@personas_bp.route('/personas/<int:persona_id>', methods=['PUT'])
def update_persona_route(persona_id):
    cursor = None

    try:
        cursor = make_connection(mysql)
        persona = get_persona(persona_id, cursor)
        if not persona:
            cursor.close()
            return jsonify({"error": "Persona not found"}), 404

        data = request.json
        name = data.get('name')
        description = data.get('description')
        prompt = data.get('prompt')

        if not name or not description or not prompt:
            cursor.close()
            return jsonify({"error": "Missing required fields"}), 400

        update_persona(persona_id, name, description, prompt, cursor)
        cursor.close()

        return jsonify({"message": f"Persona {persona_id} updated"})
    except Exception as e:
        if cursor:
            cursor.close()

        current_app.logger.error("Error updating persona", exc_info=True)
        return jsonify({"error": str(e)}), 500

@personas_bp.route('/personas/<int:persona_id>', methods=['DELETE'])
def delete_persona_route(persona_id):
    cursor = None

    try:
        cursor = make_connection(mysql)
        persona = get_persona(persona_id, cursor)
        if not persona:
            cursor.close()
            return jsonify({"error": "Persona not found"}), 404

        delete_persona(persona_id, cursor)
        cursor.close()

        return jsonify({"message": f"Persona {persona_id} deleted"})
    except Exception as e:
        if cursor:
            cursor.close()

        current_app.logger.error("Error deleting persona", exc_info=True)
        return jsonify({"error": str(e)}), 500

@personas_bp.route('/personas/<int:persona_id>', methods=['GET'])
def get_persona_route(persona_id):
    cursor = None
    try:
        cursor = make_connection(mysql)
        persona = get_persona(persona_id, cursor)
        cursor.close()

        if not persona:
            return jsonify({"error": "Persona not found"}), 404
        
        return jsonify(persona)
    except Exception as e:
        if cursor:
            cursor.close()
            
        current_app.logger.error("Error fetching persona", exc_info=True)
        return jsonify({"error": str(e)}), 500
