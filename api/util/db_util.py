from flask import current_app
from api.util.db_config import Config
from llm.personas import Persona

#RUN THIS FIRST TO CREATE THE DATABASE
def init_database(sqlObj):
    cursor = None
    try:
        cursor = sqlObj.connection.cursor()

        cursor.execute(f"CREATE DATABASE IF NOT EXISTS {Config.DATABASE}")
        cursor.execute(f"USE {Config.DATABASE}")

        with open('api/util/schema.sql', 'r') as schema_file:
            schema = schema_file.read()

            # Split statements and filter out empty ones
            statements = [stmt.strip() for stmt in schema.split(';') if stmt.strip()]
            for statement in statements:
                cursor.execute(statement)

        # Add default persona
        default_persona = Persona()

        if not get_persona_by_name(default_persona.name, cursor):
            current_app.logger.info(f"Adding default persona: {default_persona.name}")
            
            add_persona(
                name=default_persona.name,
                description=default_persona.description,
                prompt=default_persona.prompt,
                cursor=cursor
            )
            
        cursor.connection.commit()
    except Exception as e:
        current_app.logger.error("Error initializing database", exc_info=True)
        raise
    finally:
        if cursor:
            cursor.close()

def make_connection(sqlObj):
    cursor = sqlObj.connection.cursor()
    return cursor

def add_interaction(cursor, user_id, conversation_id, message, code, response, rating, reason, metadata=""):
    if not check_if_conversation_exists(conversation_id, cursor):
        cursor.execute("INSERT INTO conversations (uid, userID) VALUES (%s, %s)", (conversation_id, user_id))
    else:
        cursor.execute("UPDATE conversations SET last_interaction = CURRENT_TIMESTAMP WHERE uid = %s", (conversation_id,))
    
    cursor.execute("INSERT INTO interactions (userID, conversationID, userMessage, code, botResponse, rating, reason, metadata) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)", 
                   (user_id, conversation_id, message, code, response, rating, reason, metadata))

    cursor.connection.commit()
    return cursor

def add_user(userID, cursor):
    cursor.execute("INSERT INTO users (userID) VALUES (%s)", (userID,))
    cursor.connection.commit()
    return cursor

def update_user(userID, username, name, email, cursor):
    cursor.execute("UPDATE users SET username = %s, name = %s, email = %s WHERE userID = %s", (username, name, email, userID))
    cursor.connection.commit()
    return cursor

def check_if_user_exists(userID, cursor):
    cursor.execute("SELECT * FROM users WHERE userID = %s", (userID,))
    result = cursor.fetchall()

    if len(result) == 0:
        return False
    else:
        return True

def check_if_conversation_exists(conversationID, cursor):
    cursor.execute("SELECT * FROM conversations WHERE uid = %s", (conversationID,))
    result = cursor.fetchall()

    if len(result) == 0:
        return False
    else:
        return True
    
def check_if_interaction_exists(conversationID, message, response, code, cursor):
    cursor.execute("SELECT * FROM interactions WHERE userMessage = %s AND botResponse = %s AND code = %s AND conversationID = %s", (message, response, code, conversationID))
    result = cursor.fetchall()

    if len(result) == 0:
        return False
    else:
        return True
    
def modify_interaction_rating(conversationID, message, response, code, rating, reason, cursor):
    cursor.execute("UPDATE interactions SET rating = %s, reason = %s WHERE conversationID = %s AND userMessage = %s AND botResponse = %s AND code = %s", 
                   (rating, reason, conversationID, message, response, code))
    cursor.connection.commit()

    return cursor

def get_users_interactions(userID, cursor, k=5):
    cursor.execute("SELECT * FROM interactions WHERE userID = %s ORDER BY created_at DESC LIMIT %s", (userID, k))
    result = cursor.fetchall()
    
    return result

def get_conversation_interactions(conversationID, cursor, k=5):
    cursor.execute("SELECT * FROM interactions WHERE conversationID = %s ORDER BY created_at DESC LIMIT %s", (conversationID, k))
    result = cursor.fetchall()
    
    return result

def get_personalization(userID, cursor):
    cursor.execute("SELECT personalizedPrompt FROM users WHERE userID = %s", (userID,))
    result = cursor.fetchall()

    if len(result) == 0:
        return None
    
    return result[0][0]

def update_personalization(userID, prompt, cursor):
    cursor.execute("UPDATE users SET personalizedPrompt = %s WHERE userID = %s", (prompt, userID))
    cursor.connection.commit()

    return cursor

def add_persona(name, description, prompt, cursor):
    cursor.execute("INSERT INTO personas (name, description, prompt) VALUES (%s, %s, %s)", (name, description, prompt))
    cursor.connection.commit()

    return cursor

def update_persona(id, name, description, prompt, cursor):
    cursor.execute("UPDATE personas SET name = %s, description = %s, prompt = %s WHERE uid = %s", (name, description, prompt, id))
    cursor.connection.commit()

    return cursor

def delete_persona(id, cursor):
    cursor.execute("DELETE FROM personas WHERE uid = %s", (id,))
    cursor.connection.commit()

    return cursor

def get_personas(cursor):
    cursor.execute("SELECT * FROM personas")
    result = cursor.fetchall()

    return result

def get_persona(id, cursor):
    cursor.execute("SELECT * FROM personas WHERE uid = %s", (id,))
    result = cursor.fetchall()

    if len(result) == 0:
        return None
    
    return result[0]

def get_persona_by_name(name, cursor):
    cursor.execute("SELECT * FROM personas WHERE name = %s", (name,))
    result = cursor.fetchall()

    if len(result) == 0:
        return None
    
    return result[0]