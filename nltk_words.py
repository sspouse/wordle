import os
import json
basedir = os.path.abspath(os.path.dirname(__file__))

def get_word_list():
    file_path = os.path.join(basedir, 'static', 'wordlist.json')
    with open(file_path, "r", encoding="utf-8") as f:
        word_dict = json.load(f)
    
    return word_dict
