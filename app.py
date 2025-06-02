from flask import Flask, render_template, request, redirect, url_for, session
import random
import json
from nltk_words import get_word_list

app = Flask(__name__)
app.secret_key = 'your-secret-key'

word_dict = get_word_list()
word_list = list(word_dict.keys())
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
        # guess is word that we type
        guess = request.form['guess'].lower()

        # target is correct word 
        feedback = get_feedback(guess, target)
        attempts.append((guess, feedback))
        # attempts  is round 
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



if __name__ == "__main__":
    app.run(debug=True)
