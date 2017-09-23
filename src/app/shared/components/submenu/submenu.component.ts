// ng dependencies
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

// npm dependencies
import { Subscription } from 'rxjs/Subscription';

// custom services
import { ThemeService } from './../../services/theme.service';
import { LanguageService } from './../../services/language.service';

@Component({
  selector: 'app-submenu',
  templateUrl: './submenu.component.html'
})
export class SubmenuComponent implements OnInit {
  themeSubscription: Subscription;
  cpntData = {
    lang: null,
    theme: null,
    currentUrl: '',
    levels: []
  };
  constructor (private themeService: ThemeService,
    private languageService: LanguageService,
    public router: Router) {
    this.themeSubscription = this.themeService.currentTheme$.subscribe(data => {
    });
  }

  ngOnInit () {
    this.cpntData.currentUrl = this.router.url.split('/')[1];
    this.cpntData.lang =  this.languageService.data;
    this.cpntData.theme =  this.themeService.data;
  }

  changeLearningLang (code: string) {
    this.languageService.chooseLearningLang(code);
  }

  changeLearningTheme(uid: string) {
    this.router.parseUrl(this.router.url);
    if (this.cpntData.currentUrl) {
      this.router.navigate([this.cpntData.currentUrl + '/' + uid]);
    }
  }
  changeLearningLevel (lvl: number) {
    // console.log('submenu.component::changeLearningThemeLvl');
    this.cpntData.theme.learningLevel = lvl;
    this.themeService.getCurrentTheme();
  }
  toggleKaraoke () {
    this.themeService.toggleKaraoke();
  }
  toggleMoreInfos () {
    this.themeService.toggleMoreInfos();
  }
}