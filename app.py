from flask import Flask, render_template, request, redirect, url_for, session
import random
import json
from words import get_word_list

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
    session['invalidchar'] = []
    session['validchar'] = [] 
    return redirect(url_for('game'))

@app.route('/game', methods=['GET', 'POST'])
def game():
    target = session.get('target')
    attempts = session.get('attempts', [])
    invalidchar = session.get('invalidchar')
    validchar = session.get('validchar')

    if request.method == 'POST':
        guess = request.form['guess'].lower()
        feedback = get_feedback(guess, target)
        attempts.append((guess, feedback))
        session['attempts'] = attempts

        charinvalid, charvalid = get_invalid(guess,target)
        for c in charinvalid:
            print('c : ',c)
            if c not in invalidchar:
                invalidchar.append(c)
        session['invalidchar'] = invalidchar
        for c in charvalid:
            print('c : ',c)
            if c not in validchar:
                validchar.append(c)
        session['validchar'] = validchar


        if guess == target:
            return redirect(url_for('result', status='success'))
        elif len(attempts) >= 6:
            return redirect(url_for('result', status='fail'))

    return render_template('game.html', attempts=attempts,charinvalid=invalidchar,charvalid=validchar)

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


def get_invalid(guess, target):
    invalid = []
    valid = [] 
    for i, c in enumerate(guess):
        if c != target[i] and c not in target:
            if c not in invalid:
                invalid.append(c)
        else :
            if c not in valid:
                valid.append(c)
    
    return invalid,valid





if __name__ == "__main__":
    app.run(debug=True)
