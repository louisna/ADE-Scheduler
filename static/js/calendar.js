/*
 * Copyright (C) 2020-2024 ADE-Scheduler.
 *
 * ADE-Scheduler is free software; you can redistribute it and/or modify it
 * under the terms of the MIT License; see LICENSE file for more details.
*/

/* global Flask */

import Vue from 'vue';
import { Modal, Popover, Tooltip, Dropdown } from 'bootstrap';
import FullCalendar from '@fullcalendar/vue';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import frLocale from '@fullcalendar/core/locales/fr';
import enLocale from '@fullcalendar/core/locales/en-gb';
import Spinner from '../../components/Spinner.vue';
import SidebarMenu from '../../components/SidebarMenu.vue';
import store from './store.js';
import './base.js';
import '../css/calendar.scss';
import CoursesChoiceItem from '../../components/CoursesChoiceItem.vue';
import {getTranslatedText, getCurrentLanguage} from './services/translate';

const axios = require('axios');
const debounce = require('lodash/debounce');

const uclWeeksNo = {
  2019: [
    0, 0, 0, 0, -2, 1, 2, 3, 4, 5, 6, 7, 8, 9, -1, -1, 10, 11, 12, 13, -3, -3,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    11, 12, 13, 14, -3, -3,
  ],
  2020: [
    -3, 0, 0, 0, -2, 1, 2, 3, 4, 5, 6, 7, 8, 9, -1, -1, 10, 11, 12, 13, -3, -3,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    11, 12, 13, 14, -3, -3,
  ],
  2021: [
    0, 0, 0, -2, 1, 2, 3, 4, 5, 6, 7, 8, 9, -1, -1, 10, 11, 12, 13, -3, -3, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
    12, 13, 14, -3, -3, 0,
  ],
  2022: [
    0, 0, 0, -2, 1, 2, 3, 4, 5, 6, 7, 8, 9, -1, -1, 10, 11, 12, 13, -3, -3, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    11, 12, 13, 14, -3,
  ],
  2023: [
    -3, 0, 0, 0, -2, 1, 2, 3, 4, 5, 6, 7, 8, -1, -1, 9, 10, 11, 12, 13, -3, -3,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    11, 12, 13, 14, -3, -3,
  ],
  2024: [
    -3, 0, 0, 0, -2, 1, 2, 3, 4, 5, 6, 7, 8, -1, -1, 9, 10, 11, 12, 13, -3, -3,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    11, 12, 13, 14, -3, -3,
  ],
  2025: [
    -3, 0, 0, 0, -2, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, -1, -1, 12, 13, -3, -3,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    11, 12, 13, 14, -3, -3,
  ],
};

Date.prototype.getWeekNumber = function () {
  const d = new Date(
    Date.UTC(this.getFullYear(), this.getMonth(), this.getDate())
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
};

Date.prototype.addDays = function (days) {
  const date = new Date(this.valueOf());
  date.setDate(date.getDate() + days);
  return date;
};


document.addEventListener('DOMContentLoaded', () => {
  const isTouchDevice = !!(
    'ontouchstart' in window || navigator.maxTouchPoints
  );
  const currentLanguage = getCurrentLanguage();

  var vm = new Vue({
    el: '#app',
    delimiters: ['[[', ']]'],
    components: {
      FullCalendar,
      'sidebar-menu': SidebarMenu,
      spinner: Spinner,
      'courses-choice': CoursesChoiceItem
    },
    data() {
      return {
        projectId: [],
        schedules: [],
        currentProjectId: 0,
        codes: [],
        n_schedules: 0,
        show_best_schedules: false,
        selected_schedule: 0,
        computing: true,
        mustResetAddEventForm: true,
        code: '',
        codeSearch: [],
        autoSave: false,
        autoImport: false,
        hideAutoImportModal: false,
        unsaved: false,
        currentSchedule: {},
        currentEventColor: '',
        codeSearchDisplay: false,
        eventForm: {
          name: '',
          location: '',
          description: '',
          beginDay: '',
          endDay: '',
          beginHour: '',
          endHour: '',
          freq: [],
          beginRecurrDay: '',
          endRecurrDay: '',
          recurring: false,
        },
        importCourseInfo: {
          inscriptions: [{
            program: '',
            programAcronym: '',
            generated_codes: []
          }]
        },
        importForm:{
          codes: []
        },
        courseInfo: {
          code: '',
          title: {},
          summary: {},
          filtered: {},
        },
        eventInfo: {
          event: {},
          rrule: {},
        },
        isEditingCustomEvent: false,
        calendarOptions: {
          plugins: [dayGridPlugin, timeGridPlugin],
          locales: [frLocale, enLocale],
          locale: currentLanguage,
          timeZone: 'Europe/Brussels', // Show schedule in the same TZ where classes are given
          height: 'auto',
          slotMinTime: '07:00:00',
          slotMaxTime: '23:30:00',
          navLinks: true, // can click day/week names to navigate views
          editable: false,
          droppable: false,
          dayMaxEventRows: false, // allow "more" link when too many events
          allDaySlot: false,

          // Week display
          firstDay: 1,
          weekNumbers: true,
          weekNumberContent(arg) {
            // Get week number & year
            // From: https://stackoverflow.com/a/6117889
            // Since FC set first day to be Sunday in some places, we shift the current day by one to be at least Monday, otherwise we get previous week number.
            const weekNo = arg.date.addDays(1).getWeekNumber();
            const year = arg.date.getUTCFullYear();
            let num;
            try {
              num = uclWeeksNo[year][weekNo - 1];
            } catch (e) {
              num = 0;
            }

            const span = document.createElement('span');
            if (num > 0) {
              span.innerText = `S${num}`;
            } else {
              switch (num) {
              case -1:
                span.innerText =
                  getTranslatedText(currentLanguage, 'calendarEaster');
                break;
              case -2:
                span.innerText =
                  getTranslatedText(currentLanguage, 'calendarBreak');
                break;
              case -3:
                span.innerText =
                  getTranslatedText(currentLanguage, 'calendarBlocus');
                break;
              default:
                span.innerText = '-';
              }
            }
            return { domNodes: [span] };
          },
          // Header bar
          customButtons: {
            addEvent: {
              text: getTranslatedText(currentLanguage, 'addEventButtonText'),
              hint: getTranslatedText(currentLanguage, 'addEventButtonHint'),
              click: () => {
                vm.beforeAddEvent();
                addEventModal.show();
              },
            },
          },
          headerToolbar: {
            left:
              document.body.clientWidth > 550
                ? 'prev today next addEvent'
                : 'prev,today,next addEvent',
            center: 'title',
            right:
              document.body.clientWidth > 550
                ? 'dayGridMonth,timeGridWeek'
                : 'dayGridMonth,timeGridDay',
          },

          // Remember where the user left the calendar
          initialView:
            localStorage.getItem('fcInitialView') !== null
              ? localStorage.getItem('fcInitialView')
              : 'timeGridWeek',
          initialDate:
            localStorage.getItem('fcInitialDate') !== null
              ? parseInt(localStorage.getItem('fcInitialDate'))
              : Date.now(),
          datesSet(arg) {
            localStorage.setItem('fcInitialView', arg.view.type);
            localStorage.setItem(
              'fcInitialDate',
              arg.view.currentStart.getTime()
            );
          },
          windowResize(arg) {
            if (document.body.clientWidth > 550) {
              vm.calendarOptions.headerToolbar.right =
                'dayGridMonth,timeGridWeek';
              if (arg.view.type === 'timeGridDay') {
                this.changeView('timeGridWeek');
              }
            } else {
              vm.calendarOptions.headerToolbar.left= 'prev,today,next addEvent';
              vm.calendarOptions.headerToolbar.right =
                'dayGridMonth,timeGridDay';
              if (arg.view.type === 'timeGridWeek') {
                this.changeView('timeGridDay');
              }
            }
          },

          // Events
          events: [],
          eventContent(arg) {
            const evt = arg.event.toPlainObject({
              collapseExtendedProps: true,
            });
            const italicEl = document.createElement('t');
            italicEl.innerHTML = `<b>${evt.title}</b><br/><small>${evt.event_code}</small><br/><i>${evt.location}</i>`;
            const arrayOfDomNodes = [italicEl];
            return { domNodes: arrayOfDomNodes };
          },
          eventTextColor: 'white',
          eventDisplay: 'block',
          eventDidMount(arg) {
            // Change text color based on background
            const rgb = arg.el.style.backgroundColor.match(/\d+/g);
            const brightness = Math.round(
              (parseInt(rgb[0]) * 299 +
                parseInt(rgb[1]) * 587 +
                parseInt(rgb[2]) * 114) /
                1000
            );
            const color = brightness > 170 ? '#4c566a' : '#e5e9f0';
            arg.el.childNodes[0].style.color = color;

            // Activate tooltip
            const evt = arg.event.toPlainObject({
              collapseExtendedProps: true,
            });
            if (!!evt.code || !isTouchDevice) {
              let description;
              let location;
              let title;
              if (!evt.title) title = 'No title';
              else title = evt.title;
              if (!evt.description) description = 'No description';
              else description = evt.description;
              if (!evt.location) location = 'No location';
              else location = evt.location;
              arg.el.tooltip = new Tooltip(arg.el, {
                container: 'body',
                trigger: 'manual',
                title: `<b>${title}</b><br/>${description}<br/><i>${location}</i>`,
                sanitize: false,
                html: true,
                template: `
                  <div class="tooltip" role="tooltip">
                      <div class="tooltip-arrow"></div>
                      <div class="tooltip-inner" style="background-color:${evt.backgroundColor}; color:${color}"></div>
                  </div>`,
                placement: 'auto',
              });
            }
          },
          eventMouseEnter(arg) {
            if (!vm.computing && !!arg.el.tooltip) {
              arg.el.tooltip.show();
            }
          },
          eventMouseLeave(arg) {
            if (arg.el.tooltip) {
              arg.el.tooltip.hide();
            }
          },
          eventClick(arg) {
            const evt = arg.event.toPlainObject({
              collapseExtendedProps: true,
            });
            if (!evt.code) {
              vm.eventInfo = evt;
              vm.eventInfo.event = arg.event;
              vm.isEditingCustomEvent = false; // a better way would be to define
              // an event handler on hidden.bs.modal
              // to set isEditingCustomEvent to false
              eventModal.show();
            } else if (!isTouchDevice) {
              vm.getDetails(evt.code);
            }
          },
        },
        exportInfo: {
          url: null,
          subscriptionType: 0,
          downloadType: 0,
        },
        studiesInfo: {
          inscriptions: [],
          activities: []
        },
        shareLink: '',
      };
    },
    computed: {
      subscriptionLink() {
        return `${this.exportInfo.url}&choice=${this.exportInfo.subscriptionType}`;
      },
      selectAllToggle: {
        get() {
          return true;
        },
        set(value) {
          this.toggleAll(value);
        },
      },
    },
    mounted() {
      getTranslatedText();
    },
    watch: {
      codeSearchDisplay() {
        if (this.codeSearchDisplay) {
          codeDropdown.show();
        } else {
          codeDropdown.hide();
        }
      },
      code(newCode) {
        if (newCode === '') {
          this.codeSearch = [];
        }
        this.debouncedCodeSearchResults();
      },
    },
    created() {
      this.fetchData();
      this.debouncedCodeSearchResults = debounce(
        this.getCodeSearchResults,
        200
      );
    },
    methods: {
      fetchData() {
        this.computing = true;
        axios({
          method: 'GET',
          url: Flask.url_for('calendar.get_data'),
        })
          .then((resp) => {
            this.codes = resp.data.codes;
            this.projectId = resp.data.project_id;
            this.currentProjectId = resp.data.current_project_id;
            this.n_schedules = resp.data.n_schedules;
            this.schedules = resp.data.schedules;
            this.calendarOptions.events = resp.data.events;
            this.currentSchedule = resp.data.current_schedule;
            this.setUnsavedStatus(resp.data.unsaved);
            this.autoSave = resp.data.autosave;
            this.autoImport = resp.data.autoimport;
            this.autoImportStatus = resp.data.autoimport_status;
            this.hideAutoImportModal = resp.data.hideautoimport;
            this.calendarOptions.slotMinTime = resp.data.min_time_slot;
            this.calendarOptions.slotMaxTime = resp.data.max_time_slot;
          })
          .catch((err) => {
            store.error(err.response.data);
          })
          .then(() => {
            this.computing = false;
            const loggedOut= document.getElementById('user-logged-out');
            if (loggedOut == null ) {
              switch (this.autoImportStatus) {
              case 'ready':
                if (!this.hideAutoImportModal) {
                  autoImportModal.show();
                }
                break;
              case 'already_imported':
                // do nothing
                break;
              case 'done':
                infoImportModal.show();
                break;
              }
            }
          });
      },
      loadSchedule(e, id) {
        this.request = function () {
          this.computing = true;
          axios({
            method: 'GET',
            url: Flask.url_for('calendar.load_schedule', { id }),
          })
            .then((resp) => {
              this.codes = resp.data.codes;
              this.projectId = resp.data.project_id;
              this.currentProjectId = resp.data.current_project_id;
              this.n_schedules = resp.data.n_schedules;
              this.schedules = resp.data.schedules;
              this.calendarOptions.events = resp.data.events;
              this.currentSchedule = resp.data.current_schedule;
              this.setUnsavedStatus(resp.data.unsaved);
              this.calendarOptions.slotMinTime = resp.data.min_time_slot;
              this.calendarOptions.slotMaxTime = resp.data.max_time_slot;
            })
            .catch((err) => {
              store.error(err.response.data);
            })
            .then(() => {
              this.computing = false;
            });
        };

        if (this.unsaved && this.currentSchedule.id != id) {
          warningModal.show();
        } else {
          this.request();
        }
      },
      beforeAddEvent() {
        if (!this.mustResetAddEventForm) {
          return;
        }

        const begin = new Date();
        const end = new Date(begin.getTime() + 7200e3);
        this.eventForm.name = '';
        this.eventForm.location = '';
        this.eventForm.description = '';
        this.eventForm.freq = [];
        this.eventForm.recurring = false;
        this.eventForm.beginDay = `${begin.getFullYear()}-${`0${
          begin.getMonth() + 1
        }`.slice(-2)}-${`0${begin.getDate()}`.slice(-2)}`;
        this.eventForm.endDay = `${end.getFullYear()}-${`0${
          end.getMonth() + 1
        }`.slice(-2)}-${`0${end.getDate()}`.slice(-2)}`;
        this.eventForm.beginRecurrDay = `${begin.getFullYear()}-${`0${
          begin.getMonth() + 1
        }`.slice(-2)}-${`0${begin.getDate()}`.slice(-2)}`;
        this.eventForm.endRecurrDay = `${begin.getFullYear()}-${`0${
          begin.getMonth() + 1
        }`.slice(-2)}-${`0${begin.getDate() + 7}`.slice(-2)}`;
        this.eventForm.beginHour = `${`0${(begin.getHours() + 1) % 24}`.slice(
          -2
        )}:00`;
        this.eventForm.endHour = `${`0${(end.getHours() + 1) % 24}`.slice(
          -2
        )}:00`;
        this.mustResetAddEventForm = false;
      },
      clear() {
        this.request = function () {
          this.computing = true;
          axios({
            method: 'DELETE',
            url: Flask.url_for('calendar.clear'),
          })
            .then((resp) => {
              this.calendarOptions.events = [];
              this.n_schedules = 0;
              this.selected_schedule = 0;
              this.codes = [];
              this.currentProjectId = resp.data.current_project_id;
              this.currentSchedule = resp.data.current_schedule;
              this.setUnsavedStatus(resp.data.unsaved);
            })
            .catch((err) => {
              store.error(err.response.data);
            })
            .then(() => {
              this.loadSchedules();
              this.computing = false;
            });
        };

        if (this.unsaved) {
          warningModal.show();
        } else {
          this.request();
        }
      },
      compute() {
        this.computing = true;
        axios({
          method: 'PUT',
          url: Flask.url_for('calendar.compute'),
        })
          .then((resp) => {
            this.n_schedules = resp.data.n_schedules;
            this.selected_schedule = resp.data.selected_schedule;
            this.calendarOptions.events = resp.data.events;
            this.setUnsavedStatus(resp.data.unsaved);
            this.show_best_schedules = true;
          })
          .catch((err) => {
            store.error(err.response.data);
          })
          .then(() => {
            this.computing = false;
          });
      },
      resetBestSchedules() {
        this.computing = true;
        axios({
          method: 'DELETE',
          url: Flask.url_for('calendar.reset_best_schedules'),
        })
          .then((resp) => {
            this.n_schedules = 0;
            this.selected_schedule = 0;
            this.calendarOptions.events = resp.data.events;
            this.setUnsavedStatus(resp.data.unsaved);
            this.show_best_schedules = false;
          })
          .catch((err) => {
            store.error(err.response.data);
          })
          .then(() => {
            this.computing = false;
          });
      },
      importActivities() {
        this.computing = true;
        axios({
          method: 'GET',
          url: Flask.url_for('import.activities'),
        })
          .then((resp) => {
            this.importCourseInfo.inscriptions = resp.data.inscriptions;
            importModal.show();
          })
          .catch((err) => {
            store.error(err.response.data);
          })
          .then(() => {
            this.computing = false;
          });
      },
      getLink() {
        this.computing = true;
        axios({
          method: 'GET',
          url: Flask.url_for('calendar.export'),
        })
          .then((resp) => {
            this.exportInfo.url = `${window.location.origin}${Flask.url_for(
              'calendar.download'
            )}?link=${resp.data.link}`;
            this.shareLink = `${window.location.origin}${Flask.url_for(
              'calendar.share'
            )}?link=${resp.data.link}`;
            exportModal.show();
          })
          .catch((err) => {
            store.error(err.response.data);
          })
          .then(() => {
            this.computing = false;
          });
      },
      setUnsavedStatus(unsaved) {
        if (this.autoSave) {
          this.unsaved = false;
        } else {
          this.unsaved = unsaved;
        }
      },
      downloadCalendar() {
        open(
          Flask.url_for('calendar.download', {
            choice: this.exportInfo.downloadType,
          })
        );
      },
      save() {
        this.computing = true;
        axios({
          method: 'POST',
          url: Flask.url_for('calendar.save'),
        })
          .then((resp) => {
            // TODO: translation...
            store.success('Schedule successfuly saved !');
            this.schedules = resp.data.schedules;
            this.setUnsavedStatus(resp.data.unsaved);
          })
          .catch((err) => {
            if (err.response.status === 401) {
              store.info(err.response.data);
            } else {
              store.error(err.response.data);
            }
          })
          .then(() => {
            this.computing = false;
          });
      },
      loadSchedules() {
        this.computing = true;
        axios({
          method: 'GET',
          url: Flask.url_for('calendar.list_all_schedule'),
        })
          .then((resp) => {
            this.schedules = resp.data.schedules;
          })
          .catch((err) => {
            if (err.response.status === 401) {
              store.info(err.response.data);
            } else {
              store.error(err.response.data);
            }
          })
          .then(() => {
            this.computing = false;
          });
      },
      importInscription(){
        this.computing = true;
        axios({
          method: 'POST',
          url: Flask.url_for('import.import_schedule')
        })
          .then((resp) => {
            if (resp.status === 202) {
              store.info(resp.data);
              importModal.hide();
            } else {
              this.loadSchedule('', resp.data.current_schedule.id);
              importModal.hide();
              infoImportModal.show();
            }
          })
          .catch((err) => {
            store.error(err);
          })
          .then(() => {
            this.computing = false;
          });
      },
      hideAutoImport(){
        this.computing = true;
        axios({
          method: 'POST',
          url: Flask.url_for('account.hide_autoimport'),
          header: { 'Content-Type': 'application/json' },
        })
          .then(() => {
            this.hideAutoImportModal = true;
            autoImportModal.hide();
          })
          .catch((err) => {
            store.error(err.response.data);
          })
          .then(() => {
            this.computing = false;
          });
      },
      addCode(e, code) {
        if (code !== undefined) {
          this.code = code;
        }
        if (this.code !== '') {
          this.computing = true;
          axios({
            method: 'PATCH',
            url: Flask.url_for('calendar.add_code', {
              code: encodeURIComponent(this.code),
            }),
          })
            .then((resp) => {
              this.codes = this.codes.concat(resp.data.codes);
              this.calendarOptions.events = resp.data.events;
              this.code = '';
              this.selected_schedule = 0;
              this.setUnsavedStatus(resp.data.unsaved);
              this.calendarOptions.slotMinTime = resp.data.min_time_slot;
              this.calendarOptions.slotMaxTime = resp.data.max_time_slot;
            })
            .catch((err) => {
              if (err.response.status === 404) {
                store.warning(err.response.data);
              } else {
                store.error(err.response.data);
              }
            })
            .then(() => {
              this.computing = false;
            });
        }
      },
      removeCode(code) {
        this.computing = true;
        axios({
          method: 'DELETE',
          url: Flask.url_for('calendar.remove_code', {
            code: encodeURIComponent(code),
          }),
        })
          .then((resp) => {
            this.codes.splice(this.codes.indexOf(code), 1);
            this.calendarOptions.events = resp.data.events;
            this.selected_schedule = 0;
            this.setUnsavedStatus(resp.data.unsaved);
            this.calendarOptions.slotMinTime = resp.data.min_time_slot;
            this.calendarOptions.slotMaxTime = resp.data.max_time_slot;
          })
          .catch((err) => {
            store.error(err.response.data);
          })
          .then(() => {
            this.computing = false;
          });
      },
      addEvent(e) {
        const evt = {
          name: this.eventForm.name,
          location: this.eventForm.location,
          description: this.eventForm.description,
        };
        if (this.eventForm.recurring) {
          evt.begin = `${this.eventForm.beginRecurrDay} ${this.eventForm.beginHour}`;
          evt.end = `${this.eventForm.beginRecurrDay} ${this.eventForm.endHour}`;
          evt.end_recurrence = `${this.eventForm.endRecurrDay} ${this.eventForm.endHour}`;
          evt.freq = this.eventForm.freq;
        } else {
          evt.begin = `${this.eventForm.beginDay} ${this.eventForm.beginHour}`;
          evt.end = `${this.eventForm.endDay} ${this.eventForm.endHour}`;
        }
        this.computing = true;
        axios({
          method: 'POST',
          url: Flask.url_for('calendar.add_custom_event'),
          data: evt,
          header: { 'Content-Type': 'application/json' },
        })
          .then((resp) => {
            this.calendarOptions.events.push(resp.data.event);
            this.mustResetAddEventForm = true;
            addEventModal.hide();
            e.target.reset();
            this.setUnsavedStatus(resp.data.unsaved);
          })
          .catch((err) => {
            store.error(err.response.data);
          })
          .then(() => {
            this.computing = false;
          });
      },
      updateEditingCustomEvent() {
        if (this.isEditingCustomEvent) {
          this.updateEvent();
        } else {
          this.isEditingCustomEvent = true;
        }
      },
      updateEvent() {
        this.computing = true;
        axios({
          method: 'POST',
          url: Flask.url_for('calendar.update_custom_event', {
            id: this.eventInfo.id,
          }),
          data: {
            title: this.eventInfo.title,
            location: this.eventInfo.location,
            description: this.eventInfo.description,
            color: this.eventInfo.backgroundColor,
            schedule_number: this.selected_schedule,
          },
        })
          .then((resp) => {
            this.calendarOptions.events = resp.data.events;
            this.isEditingCustomEvent = false;
            this.setUnsavedStatus(resp.data.unsaved);
            eventModal.hide();
          })
          .catch((err) => {
            store.error(err.response.data);
          })
          .then(() => {
            this.computing = false;
          });
      },
      checkMinDay() {
        if (
          this.eventForm.beginDay > this.eventForm.endDay ||
          !this.eventForm.endDay
        ) {
          this.eventForm.endDay = this.eventForm.beginDay;
        }
      },
      checkMaxDay() {
        if (
          this.eventForm.beginDay > this.eventForm.endDay ||
          !this.eventForm.beginDay
        ) {
          this.eventForm.beginDay = this.eventForm.endDay;
        }
      },
      checkMinRecurrDay() {
        if (
          this.eventForm.beginRecurrDay > this.eventForm.endRecurrDay ||
          !this.eventForm.endRecurrDay
        ) {
          this.eventForm.endRecurrDay = this.eventForm.beginRecurrDay;
        }
      },
      checkMaxRecurrDay() {
        if (
          this.eventForm.beginRecurrDay > this.eventForm.endRecurrDay ||
          !this.eventForm.beginRecurrDay
        ) {
          this.eventForm.beginRecurrDay = this.eventForm.endRecurrDay;
        }
      },
      checkMinHour() {
        if (
          this.eventForm.beginHour > this.eventForm.endHour ||
          !this.eventForm.endHour
        ) {
          this.eventForm.endHour = this.eventForm.beginHour;
        }
      },
      checkMaxHour() {
        if (
          this.eventForm.beginHour > this.eventForm.endHour ||
          !this.eventForm.beginHour
        ) {
          this.eventForm.beginHour = this.eventForm.endHour;
        }
      },
      getDetails(code) {
        if (this.courseInfo.code === code) {
          courseModal.show();
        } else {
          this.computing = true;
          axios({
            method: 'GET',
            url: Flask.url_for('calendar.get_info', {
              code: encodeURIComponent(code),
            }),
          })
            .then((resp) => {
              this.courseInfo.code = code;
              this.courseInfo.title = resp.data.title;
              this.courseInfo.summary = resp.data.summary;
              this.courseInfo.filtered = {};

              Object.entries(this.courseInfo.summary).forEach(([key, val]) => {
                Vue.set(this.courseInfo.filtered, key, {});
                Object.entries(val).forEach(([k, v]) => {
                  Vue.set(this.courseInfo.filtered[key], k, {});
                  v.forEach((item) => {
                    if (resp.data.filtered[key])
                      Vue.set(
                        this.courseInfo.filtered[key][k],
                        item,
                        !resp.data.filtered[key].includes(`${k}: ${item}`)
                      );
                  });
                });
              });

              courseModal.show();
            })
            .catch((err) => {
              store.error(err.response.data);
            })
            .then(() => {
              this.computing = false;
            });
        }
      },
      applyFilter() {
        this.computing = true;
        axios({
          method: 'PUT',
          url: Flask.url_for('calendar.apply_filter'),
          data: this.courseInfo.filtered,
          header: { 'Content-Type': 'application/json' },
        })
          .then((resp) => {
            this.selected_schedule = 0;
            this.calendarOptions.events = resp.data.events;
            this.setUnsavedStatus(resp.data.unsaved);
          })
          .catch((err) => {
            store.error(err.response.data);
          })
          .then(() => {
            this.computing = false;
          });
      },
      closeSidebar() {
        this.$refs.sidebar.close();
      },
      toggleBestSchedules() {
        this.show_best_schedules = !this.show_best_schedules;
      },
      removeEvent(event) {
        this.computing = true;
        axios({
          method: 'DELETE',
          url: Flask.url_for('calendar.delete_custom_event', { id: event.id }),
        })
          .then((resp) => {
            this.calendarOptions.events = this.calendarOptions.events.filter(
              (item) => item.id !== event.id
            );
            this.setUnsavedStatus(resp.data.unsaved);
          })
          .catch((err) => {
            store.error(err.response.data);
          })
          .then(() => {
            this.computing = false;
          });
      },
      getEvents(schedule_number) {
        this.computing = true;
        axios({
          method: 'GET',
          url: Flask.url_for('calendar.get_events'),
          params: { schedule_number },
        })
          .then((resp) => {
            this.calendarOptions.events = resp.data.events;
            this.selected_schedule = schedule_number;
          })
          .catch((err) => {
            store.error(err.response.data);
          })
          .then(() => {
            this.computing = false;
          });
      },
      updateYear() {
        this.computing = true;
        axios({
          method: 'PUT',
          url: Flask.url_for('calendar.update_poject_id', {
            id: this.currentProjectId,
          }),
        })
          .then((resp) => {
            this.selected_schedule = 0;
            this.calendarOptions.events = resp.data.events;
            this.setUnsavedStatus(resp.data.unsaved);
          })
          .catch((err) => {
            store.error(err.response.data);
          })
          .then(() => {
            this.computing = false;
          });
      },
      copyToClipboard(id) {
        const copyText = document.getElementById(id);
        copyText.select();
        copyText.setSelectionRange(0, 99999); // for mobile
        copyText.classList.add('is-valid');
        document.execCommand('copy');
      },
      getCodeSearchResults() {
        if (this.code !== '') {
          axios({
            method: 'GET',
            url: Flask.url_for('calendar.search_code', {
              search_key: encodeURIComponent(this.code),
            }),
          })
            .then((resp) => {
              this.codeSearch = resp.data.codes;
              codeDropdown.update();
            })
            .catch((err) => {
              store.error(err.response.data);
            })
            .then(() => {});
        }
      },
      warningConfirmed() {
        this.request();
      },
      request() {},
      updateColor() {
        this.computing = true;
        axios({
          method: 'POST',
          url: Flask.url_for('calendar.update_color'),
          header: { 'Content-Type': 'applacation/json' },
          data: {
            schedule_number: this.selected_schedule,
            color_palette: this.currentSchedule.color_palette,
          },
        })
          .then((resp) => {
            this.calendarOptions.events = resp.data.events;
            this.setUnsavedStatus(resp.data.unsaved);
          })
          .catch((err) => {
            store.error(err.response.data);
          })
          .then(() => {
            this.computing = false;
          });
      },
      resetColorPalette() {
        this.computing = true;
        axios({
          method: 'DELETE',
          url: Flask.url_for('calendar.reset_color'),
          data: { schedule_number: this.selected_schedule },
        })
          .then((resp) => {
            this.calendarOptions.events = resp.data.events;
            this.currentSchedule.color_palette = resp.data.color_palette;
            this.setUnsavedStatus(resp.data.unsaved);
          })
          .catch((err) => {
            store.error(err.response.data);
          })
          .then(() => {
            this.computing = false;
          });
      },
      toggleAll(toggle) {
        const { summary } = this.courseInfo;
        const { filtered } = this.courseInfo;
        Object.keys(summary).forEach((name) => {
          const course = summary[name];
          Object.keys(course).forEach((eventType) => {
            const codes = course[eventType];
            Object.keys(codes).forEach((idx) => {
              const code = codes[idx];
              filtered[name][eventType][code] = toggle;
            });
          });
        });
      },
      getYearShort() {
        let yearShort = '2024'; // Default value
        this.projectId.forEach((project) => {
          if (project.id == this.currentProjectId) {
            yearShort = project.year.slice(0, 4);
          }
        });
        return `${yearShort}`;
      },
      getCourseURL(code) {
        const yearShort= this.getYearShort();
        const courseBaseUrl = getTranslatedText(currentLanguage, 'courseBaseUrl');
        return `${courseBaseUrl}-${yearShort}-${code}`;
      },
    },
  });

  [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]')).map(
    (popoverTriggerEl) =>
      new Popover(popoverTriggerEl, {
        container: 'body',
        trigger: 'focus',
      })
  );

  // Customize class on add Event button
  document.body.onload = function() {
    const objs = document.getElementsByClassName('fc-addEvent-button');
    objs[0].className = 'fc-addEvent-button';
    objs[0].classList.add('btn');
    objs[0].classList.add('btn-primary');
  };

  var codeDropdown = new Dropdown(document.getElementById('codeInputDropdown'));
  var addEventModal = new Modal(document.getElementById('addEventModal'));
  var eventModal = new Modal(document.getElementById('eventModal'));
  var importModal = new Modal(document.getElementById('importModal'));
  var exportModal = new Modal(document.getElementById('exportModal'));
  var courseModal = new Modal(document.getElementById('courseModal'));
  var warningModal = new Modal(document.getElementById('warningModal'));
  var infoImportModal = new Modal(document.getElementById('infoImportModal'));
  var autoImportModal = new Modal(document.getElementById('autoImportModal'));
});
