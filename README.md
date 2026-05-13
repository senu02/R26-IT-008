# Personalized Emotional Shielding and Adaptive Toxicity Filtering System

## Project Structure

```plaintext
personalized-emotional-shielding-system/
│
├── README.md
├── requirements.txt
├── package.json
├── .gitignore
├── manage.py
│
├── backend/
│   ├── settings.py
│   ├── urls.py
│   ├── wsgi.py
│   └── asgi.py
│
├── frontend/
│   ├── public/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── services/
│       ├── styles/
│       ├── App.js
│       └── index.js
│
├── apps/
│   │
│   ├── toxicity_detection/
│   │   ├── datasets/
│   │   ├── models/
│   │   ├── training/
│   │   ├── inference/
│   │   ├── views.py
│   │   ├── urls.py
│   │   └── serializers.py
│   │
│   ├── emotional_shielding/
│   │   ├── strategies/
│   │   ├── services/
│   │   ├── views.py
│   │   ├── urls.py
│   │   └── utils.py
│   │
│   ├── multilingual_processing/
│   │   ├── singlish_processing/
│   │   ├── sinhala_processing/
│   │   ├── emoji_removal/
│   │   └── preprocessing.py
│   │
│   ├── image_toxicity/
│   │   ├── cnn_models/
│   │   ├── preprocessing/
│   │   ├── image_utils.py
│   │   ├── views.py
│   │   └── urls.py
│   │
│   ├── audio_toxicity/
│   │   ├── whisper_stt/
│   │   ├── speech_processing/
│   │   ├── views.py
│   │   └── urls.py
│   │
│   ├── xai_module/
│   │   ├── explanations/
│   │   ├── trigger_words/
│   │   ├── visualizations/
│   │   └── utils.py
│   │
│   └── user_behavior/
│       ├── profile_management/
│       ├── dynamic_threshold/
│       ├── punishment_system/
│       └── moderation_history/
│
├── datasets/
│   ├── english_dataset/
│   ├── singlish_dataset/
│   ├── image_dataset/
│   └── audio_dataset/
│
├── trained_models/
│   ├── bilstm_model.h5
│   ├── cnn_model.h5
│   ├── tokenizer.pkl
│   └── label_encoder.pkl
│
├── media/
│   ├── uploaded_images/
│   ├── uploaded_audio/
│   └── reports/
│
├── api/
│   ├── authentication/
│   ├── moderation_api/
│   └── gateway/
│
├── documentation/
│   ├── architecture_diagram/
│   ├── component_diagram/
│   ├── gantt_chart/
│   ├── wbs/
│   └── research_documents/
│
└── tests/
    ├── unit_tests/
    ├── integration_tests/
    └── api_tests/
```

---

# README.md

## Project Title

Personalized Emotional Shielding and Adaptive Toxicity Filtering System

---

## Overview

The Personalized Emotional Shielding and Adaptive Toxicity Filtering System is an AI-powered moderation platform designed to detect toxic online content and provide adaptive emotional protection for users.

The system combines:

* Multi-label toxicity detection
* Emotional shielding
* Explainable AI (XAI)
* Multilingual toxicity analysis
* Image toxicity detection
* Audio toxicity detection
* User behavior monitoring

This platform aims to create a safer and healthier online communication environment.

---

# Problem Statement

Online platforms increasingly face toxic behaviors such as:

* Cyberbullying
* Hate speech
* Harassment
* Offensive memes
* Toxic comments

Traditional moderation systems apply fixed filtering methods and ignore:

* User emotional sensitivity
* Contextual communication
* Repeated toxic behavior
* Personalized protection

This project introduces adaptive emotional shielding to improve moderation quality and user safety.

---

# Key Features

## Multi-Label Toxicity Detection

Detects multiple toxicity categories simultaneously:

* Toxic
* Severe Toxic
* Obscene
* Threat
* Insult
* Identity Hate

---

## Adaptive Emotional Shielding (AESM)

Provides adaptive protection strategies based on:

* Toxicity severity
* User emotional sensitivity
* Toxic behavior history
* Contextual communication patterns

### Protection Mechanisms

* Content hiding
* Content blurring
* Warning notifications
* Tone rewriting
* Emotional support responses

---

## Explainable AI (XAI)

Provides transparent moderation explanations:

* Trigger word highlighting
* Toxicity score visualization
* Warning history
* Alternative wording suggestions

---

## Multilingual Support

Supports:

* English
* Sinhala
* Singlish

Includes:

* Slang normalization
* Spelling correction
* Emoji removal

---

## Image Toxicity Detection

Detects:

* Toxic memes
* Harmful screenshots
* Offensive images
* Abusive visual content

---

## Audio Toxicity Detection

Uses speech-to-text and deep learning techniques to detect:

* Toxic voice comments
* Hate speech in audio
* Verbal harassment

---

# Technologies Used

## Frontend

* React.js
* HTML
* CSS
* JavaScript

## Backend

* Django
* Django REST Framework

## AI / Machine Learning

* TensorFlow
* Keras
* BiLSTM
* CNN
* Whisper STT

## Database

* SQLite
* MySQL

## Cloud Services

* AWS

---

# Installation Guide

## Clone Repository

```bash
https://github.com/senu02/R26-IT-008/tree/main
```

---

## Backend Setup

```bash
cd personalized-emotional-shielding-system
python -m venv venv
```

### Activate Virtual Environment

#### Windows

```bash
venv\Scripts\activate
```

#### Linux / MacOS

```bash
source venv/bin/activate
```

---

## Install Dependencies

```bash
pip install -r requirements.txt
```

---

## Run Database Migrations

```bash
python manage.py migrate
```

---

## Start Backend Server

```bash
python manage.py runserver
```

---

# Frontend Setup

```bash
cd frontend
npm install
npm start
```

---

# System Modules

## 1. Toxicity Detection Module

* Multi-label toxicity prediction
* Context-aware analysis
* Real-time classification

## 2. Adaptive Emotional Shielding Module

* Dynamic emotional protection
* Adaptive filtering strategies
* Emotional response generation

## 3. Multilingual & Image Toxicity Module

* Toxic image detection
* Singlish text processing
* Emoji removal
* Image classification

## 4. Explainable AI Module

* Moderation explanation generation
* Trigger word detection
* Transparency support

## 5. User Behavior Monitoring Module

* Toxic behavior tracking
* Dynamic threshold calculation
* Graduated punishment system

---

# Functional Requirements

* Real-time toxicity detection
* Multi-label classification
* Image upload and analysis
* Audio toxicity analysis
* Adaptive emotional protection
* Warning generation
* Moderation history tracking
* Admin dashboard

---

# Non-Functional Requirements

* High accuracy
* Scalability
* Reliability
* Security
* Low latency
* Usability

---

# Novel Contributions

## Adaptive Emotional Shielding

Provides personalized emotional protection instead of simple content blocking.

## Dynamic Threshold System

Moderation thresholds adjust based on user behavior history.

## Explainable AI Moderation

Explains moderation decisions clearly to users.

## Multimodal Toxicity Detection

Supports:

* Text
* Audio
* Images

## Multilingual Support

Handles Sinhala, English, and Singlish content.

---

# Team Members

| Student ID | Name               | Module                         |
| ---------- | ------------------ | ------------------------------ |
| IT22245892 | Perera M D S       | Multilingual & Image Detection |
| IT22116260 | Tharindi W A K     | Toxicity Detection             |
| IT22252968 | Praveen H G        | Adaptive Emotional Shielding   |
| IT22169594 | Manohara H U K R T | XAI & User Behavior            |

---

# Future Improvements

* Video toxicity detection
* Real-time social media integration
* Advanced emotion analysis
* Mobile application support
* Enhanced multilingual datasets

---

# Commercialization Plan

## Target Platforms

* Social media platforms
* Online forums
* Educational platforms
* News portals
* Community applications

## Benefits

* Reduces human moderation costs
* Provides real-time moderation
* Easy REST API integration
* Improves online safety

---

# License

This project is developed for academic and research purposes.

---

# Conclusion

The Personalized Emotional Shielding and Adaptive Toxicity Filtering System introduces an intelligent moderation framework that combines AI toxicity detection with adaptive emotional protection.

The system improves online safety by:

* Detecting harmful content intelligently
* Understanding user behavior
* Applying adaptive moderation strategies
* Providing transparent explanations
* Supporting multilingual communication

This project contributes toward building safer and emotionally healthier digital communities.
