from flask import Blueprint, json, request, jsonify, current_app
from api.extensions import mysql
from llm.sigil import Sigil
from llm.personas import Persona
from api.util.db_util import add_user, check_if_user_exists, make_connection, get_personalization, get_persona_by_name, add_interaction, update_user

prompt_bp = Blueprint('prompt', __name__)
chat = Sigil()

@prompt_bp.route('/prompt', methods=['POST'])
def prompt_sigil():
    data = request.get_json()
    user_id = data.get('userID')
    conversation_id = data.get('conversationID')
    message = data.get('message')
    code = data.get('code') or ''
    history = data.get('history') or []
    log_chat = data.get('logChat') or False
    personalize = data.get('personalize') or False
    persona_name = data.get('persona') or Persona().name # Default to the default persona
    user_metadata = data.get('userMetaData') or {}

    if not message or not user_id or not conversation_id:
        current_app.logger.error("Missing required data in prompt request")
        return jsonify({'message': 'Some required data is missing'}), 400

    cursor = make_connection(mysql)
    personalization = get_personalization(user_id, cursor) if personalize else ""

    # Fall back to default persona if no persona is specified or persona not found
    persona = Persona()
    persona_from_db = get_persona_by_name(persona_name, cursor)

    if persona_from_db:
        persona = Persona(
            name=persona_from_db[1],
            description=persona_from_db[2],
            prompt=persona_from_db[3]
        )
    else:
        current_app.logger.warning(f"Persona {persona_name} not found")

    response = chat(
        message, 
        code=code, 
        history=history, 
        personalization=personalization,
        persona=persona
    )

    if log_chat:
        try:
            if not check_if_user_exists(user_id, cursor):
                add_user(user_id, cursor)
            
            update_user(user_id, user_metadata.get('login'), user_metadata.get('name'), user_metadata.get('email'), cursor)

            interaction_metadata = jsonify({
                "persona_used": persona.name,
                "personalization": personalization
            })

            add_interaction(cursor, user_id, conversation_id, message, code, response.answer, None, None, interaction_metadata.get_data(as_text=True))
        except:
            cursor.close()
            current_app.logger.error("Error logging interaction, but will still return response", exc_info=True)
            return jsonify({'response': response.answer, 'warning': 'Interaction logging failed'}), 200
        
    cursor.close()

    return jsonify({'response': response.answer})