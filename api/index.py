from flask import Flask, render_template, request, redirect, url_for, session
import random
from nltk_words import get_five_letter_words

app = Flask(__name__)
app.secret_key = 'your-secret-key'

word_list = get_five_letter_words()

@app.route('/')
def home():
    return render_template('home.html')

@app.route('/start')
def start_game():
    session['target'] = random.choice(word_list)
    session['attempts'] = []
    return redirect(url_for('game'))

@app.route('/game', methods=['GET', 'POST'])
def game():
    target = session.get('target')
    attempts = session.get('attempts', [])

    if request.method == 'POST':
        guess = request.form['guess'].lower()
        feedback = get_feedback(guess, target)
        attempts.append((guess, feedback))
        session['attempts'] = attempts

        if guess == target:
            return redirect(url_for('result', status='success'))
        elif len(attempts) >= 6:
            return redirect(url_for('result', status='fail'))

    return render_template('game.html', attempts=attempts)

@app.route('/result/<status>')
def result(status):
    target = session.get('target')
    return render_template('result.html', status=status, word=target)

def get_feedback(guess, target):
    result = []
    for i, c in enumerate(guess):
        if c == target[i]:
            result.append('🟩')
        elif c in target:
            result.append('🟨')
        else:
            result.append('⬜')
    return ''.join(result)