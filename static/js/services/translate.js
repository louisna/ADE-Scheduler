/*
 * Copyright (C) 2020-2024 ADE-Scheduler.
 *
 * ADE-Scheduler is free software; you can redistribute it and/or modify it
 * under the terms of the MIT License; see LICENSE file for more details.
*/

const translations = {
  en: {
    addEventButtonText: '+ Create event',
    addEventButtonHint: 'Create a new event',
    courseBaseUrl: 'https://www.uclouvain.be/en-cours',
    calendarBlocus: 'Blocus',
    calendarBreak: 'Break',
    calendarEaster: 'Easter',
    selectAllButtonLabel: 'Select all',
    CM: 'Magistral course',
    OTHER: 'Other activity',
    TP: 'Practical work'
  },
  fr: {
    addEventButtonText: '+ Créer un évènement',
    addEventButtonHint: 'Créer un nouvel évènement',
    courseBaseUrl: 'https://www.uclouvain.be/cours',
    calendarBlocus: 'Blocus',
    calendarBreak: 'Congé',
    calendarEaster: 'Pâques',
    selectAllButtonLabel: 'Tout sélectionner',
    CM: 'Cours Magistral',
    OTHER: 'Activité autre',
    TP: 'Travaux Pratiques'
  },
};

export function getTranslatedText(lang, key) {
  return translations[lang] && translations[lang][key] ? translations[lang][key] : key;
}

export function getCurrentLanguage() {
  return document.getElementById('current-locale').textContent.trim().toLowerCase();
}
