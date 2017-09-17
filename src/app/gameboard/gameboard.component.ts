// ng dependencies
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

// npm dependencies
import { Subscription } from 'rxjs/Subscription';

// custom models
import { GameboardCpntData } from './gameboard.models';
import { Item } from './../shared-models/item.models';

// custom services
import { ThemeService } from './../shared-services/theme.service';
import { LanguageService } from './../shared-services/language.service';

@Component({
  selector: 'app-gameboard',
  templateUrl: './gameboard.component.html'
})
export class GameboardComponent implements OnInit, OnDestroy {
  themeSubscription: Subscription;
  cpntData: GameboardCpntData = {
    winItemIdx: null,
    clickedIdx: null,
    currentQuestionTimer: '0',
    items: [],
    lang: null,
    theme: null,
    isCheckingAnswer: false
  };
  last3Answers: Array<string> = [];
  allItems: Array<Item> = [];
  questionTimer: number = null;
  QUESTION_TIMER_DURATION = 8;
  constructor (private themeService: ThemeService,
    private languageService: LanguageService,
    private route: ActivatedRoute,
    public router: Router) {
    this.themeSubscription = this.themeService.currentTheme$.subscribe(data => {
      this.resetTheme(data);
    });
  }

  /*
    A getter to recalculate if the lao special font is needed
   */
  get isLaoLanguage () {
    return this.cpntData.lang && this.cpntData.theme &&
    (this.cpntData.lang.currentLang === 'lo' && !this.cpntData.theme.isReversed) ||
    (this.cpntData.lang.currentLang !== 'lo' && this.cpntData.theme.isReversed);
  }

  ngOnInit () {
    this.cpntData.lang =  this.languageService.data;
    this.cpntData.theme =  this.themeService.data;
    this.route.params.subscribe(params => {
      if (params.uid && this.cpntData.theme.all.find(item => item.uid === params.uid)) {
        this.themeService.changeLearningTheme(params.uid);
      } else {
        this.router.navigate(['404']);
      }
    });
  }

  changeDisplayedItems () {
    this.resetQuestionTimer();

    // choose element displayed, thend put it in template
    const ITEM_DISPLAYED_NBR = 4;
    const items = this.allItems.slice();
    for (let i = 0; i < ITEM_DISPLAYED_NBR; i++) {
      let randomItemIdx = Math.floor(Math.random() * items.length);
      while (items[randomItemIdx].meta &&
        items[randomItemIdx].meta.conflicts &&
        this.cpntData.items.find((item) => {
          // if (items[randomItemIdx].meta.conflicts.indexOf(item.uid) !== -1) {
          //   console.log('changeDisplayedItems conflict:', item.uid, items[randomItemIdx].uid);
          // }
          return items[randomItemIdx].meta.conflicts.indexOf(item.uid) !== -1;
        })) {
        randomItemIdx = Math.floor(Math.random() * items.length);
      }
      this.cpntData.items.push(items[randomItemIdx]);
      items.splice(randomItemIdx, 1);
    }
    // choose the good answer then put in template
    let winIdx = Math.floor(Math.random() * ITEM_DISPLAYED_NBR);
    while (this.last3Answers.indexOf(this.cpntData.items[winIdx].uid) !== -1) {
      // console.log('winIdx conflicts', this.cpntData.items[winIdx].uid, this.last3Answers);
      winIdx = Math.floor(Math.random() * ITEM_DISPLAYED_NBR);
    }
    this.cpntData.winItemIdx = winIdx;
    this.last3Answers.unshift(this.cpntData.items[winIdx].uid);

    if (this.last3Answers.length > 3) {
      this.last3Answers.pop();
    }
    this.launchQuestionTimer();
  }

  checkAnswer (index) {
    this.cpntData.isCheckingAnswer = true;
    this.cpntData.clickedIdx = index;
    window.clearInterval(this.questionTimer);
  }

  nextQuestion () {
    this.cpntData.clickedIdx = null;
    this.cpntData.winItemIdx = null;
    this.cpntData.items.length = 0;
    this.changeDisplayedItems();
  }

  resetTheme (items: Array<Item>) {
    // console.log('gameboard.component::resetTheme', items);
    this.cpntData.clickedIdx = null;
    this.cpntData.winItemIdx = null;
    this.allItems.length = 0;
    this.allItems.push(...items);
    this.cpntData.items.length = 0;
    this.changeDisplayedItems();
  }

  launchQuestionTimer () {
    // console.log('gameboard.component::launchQuestionTimer');
    let ctr = 0;
    this.questionTimer = window.setInterval(() => {
      ctr++;
      this.cpntData.currentQuestionTimer = ((ctr) / this.QUESTION_TIMER_DURATION).toFixed(2);
      this.cpntData.isCheckingAnswer = false;
      // max reached?
      if (ctr > (this.QUESTION_TIMER_DURATION * 100) + 1) {
        this.checkAnswer(-1);
      }
    }, 10);

  }

  resetQuestionTimer () {
    this.cpntData.currentQuestionTimer = '0';
    if (this.questionTimer) {
      window.clearInterval(this.questionTimer);
    }
  }

  ngOnDestroy() {
    // prevent memory leak when component destroyed
    window.clearInterval(this.questionTimer);
    this.themeSubscription.unsubscribe();
  }
}
