import dspy
import sys
from dotenv import load_dotenv
from llm.personas import Persona

load_dotenv()

verbose = len(sys.argv) > 1 and (sys.argv[1] == '-v' or sys.argv[1] == '--verbose')

gpt = dspy.LM('openai/gpt-4o-mini')
dspy.settings.configure(lm=gpt)

class Sigil(dspy.Module):
    def __init__(self, history_capacity=6, feedback_capacity=3):
        self.history_capacity = history_capacity
        self.feedback_capacity = feedback_capacity

        self.personalize = dspy.ChainOfThought(Personalize)
        self.answer_question = dspy.Predict(Answer)
    
    # Given a list of feedback, and optionally an existing personalized prompt,
    # get/update personalized prompt to improve future responses
    def get_personalization_from_feedback(self, feedback, personalization=""):
        feedback_to_provide = feedback

        if len(feedback) > self.feedback_capacity:
            feedback_to_provide = feedback[len(feedback) - self.feedback_capacity:]

        output = self.personalize(feedback=feedback_to_provide, existing_personalization=personalization)
        return output

    # Given a student message, code, and history, provide an answer to the message
    def forward(self, message, persona=Persona(), code="", history=[], personalization=""):
        history_to_provide = history

        if len(history) > self.history_capacity:
            history_to_provide = history[len(history) - self.history_capacity:]

        persona_str = f"{persona.name}: {persona.description}\n{persona.prompt}"

        output = self.answer_question(history=history_to_provide, persona=persona_str, personalization=personalization, student_message=message, code=code)
        return output

# Signature to reason about how to best personalize answer for student, given some extra info
class Personalize(dspy.Signature):
    """
    You are Sigil, a friendly computer science tutor for novice computer science students. Help personalize
    your future responses for this student by creating extra guidelines based on their feedback. However,
    ensure that the personalized guidelines do not violate any of these base guidelines:

    1. Only provide answers/information that is directly asked for by the student, and when doing so, do not provide direct source code answers.
    2. Try to respond with guiding questions whenever possible, and feel free to ask the student for any info that would be useful for you in helping them.

    Before providing the final output, reason about the student's needs, and consider whether or not the feedback
    contradicts the base guidelines.

    Your task is to update the existing personalization if provided, or start from scratch if not. Leave anything 
    that contradicts the base guidelines out of the final output. It is acceptable to do nothing if you cannot 
    determine anything new or useful from the provided feedback. Provide the guidelines in numbered list format.
    """

    feedback = dspy.InputField(desc="Feedback provided by the student on previous responses, in the following format:\nResponse: (chatbot response)\n(Helpful/unhelpful): (reason)")
    existing_personalization = dspy.InputField(desc="Existing personalization for this student (optional)")

    personalization = dspy.OutputField(desc="Instructions on how to personalize responses for this student")

# Signature to get final answer
class Answer(dspy.Signature):
    """
    You are a computer science tutor. Embody the role of a helpful tutor using the given `persona`, while following these general guidelines:

    1. Do not provide complete source code solutions.
    2. Only respond to what the student explicitly asks.
    3. Uphold academic integrity at all times — do not assist with cheating, plagiarism, or other misconduct.

    Additionally, follow the personalized instructions in the `personalization` field, so long as they do not conflict with these base guidelines.
    """

    history = dspy.InputField(desc="Conversation history for context")
    persona = dspy.InputField(desc="Persona of the tutor, including their name and any other relevant details")
    personalization = dspy.InputField(desc="Extra guidelines to tailor responses for this student")

    code = dspy.InputField(desc="Code provided by the student, usually in the following format:\ndescription of code (file name):\nthe code")
    student_message = dspy.InputField(desc="Message from the student")

    answer = dspy.OutputField(desc="Concise response to student's message (no source code answers)")
