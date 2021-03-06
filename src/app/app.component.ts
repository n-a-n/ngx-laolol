// ng dependencies
import { Component, OnDestroy, OnInit } from '@angular/core';
import {
		Router,
		// import as RouterEvent to avoid confusion with the DOM Event
		Event as RouterEvent,
		NavigationStart,
		NavigationEnd,
		NavigationCancel,
		NavigationError
} from '@angular/router';

// npm dependencies
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { LocalizeRouterService } from 'localize-router';
import 'rxjs/add/operator/filter';

// custom modules
import { ROUTES_CONFIG } from './shared/values/routes.values';

// custom services
import { SeoService } from './shared/services/seo.service';
import { LanguageService } from './shared/services/language.service';
import { ThemeService } from './shared/services/theme.service';
import { UserService } from './shared/services/user.service';
import { StorageService } from './shared/services/storage.service';
import { ApiService } from './shared/services/api.service';
import { ItemService } from './shared/services/item.service';

// custome models
import { ISeoServiceData } from './shared/models/services-data.models';

// custom components
import { LaololComponent } from './shared/components/abstract/laolol.component';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html'
})
export class AppComponent extends LaololComponent implements OnInit, OnDestroy {
	routeSubscription: Subscription;
	seoData: ISeoServiceData;
	initilized = false;
	cpntData = {
		user: null,
		loadingRoute: true,
		currentVersion: 'Version 1.1.2',
		currentUrl: ''
	};
	constructor (public router: Router, private userService: UserService,
		private storageService: StorageService, private apiService: ApiService,
		private localize: LocalizeRouterService, private seoService: SeoService,
		itemService: ItemService, languageService: LanguageService, themeService: ThemeService) {
		super(itemService, languageService, themeService);
	}

	ngOnInit () {
		this.seoData = this.seoService.data;

		// manage loading states
		this.themeData =  this.themeService.data;
		this.routeSubscription = this.router.events.subscribe((event: RouterEvent) => {
			this.navigationInterceptor(event);
		});

		// clear store if it's a new app version
		const appVersion = this.storageService.getItem('appVersion');
		if (appVersion !== this.cpntData.currentVersion) {
			this.storageService.clear();
			this.storageService.setItem('appVersion', this.cpntData.currentVersion);
		}
		const itemsVersion = this.storageService.getItem('itemsVersion');
		this.apiService.getResources('api/version').catch(error => {
			return Observable.throw(new Error());
		}).subscribe((version: any) => {
			if (itemsVersion !== version.current) {
				this.itemService.resetItems();
				this.themeService.resetThemes();
				this.storageService.setItem('itemsVersion', version.current);
			}
			this.itemService.initialize();
			this.themeService.initialize();
		}, err => {
			console.error('updateVersion ERROR:', err);
			this.itemService.resetItems();
			this.themeService.resetThemes();
		});

		// init available data
		this.cpntData.user = this.userService.data;
	}

	get currentThemeSlug () {
		return this.themeData.learning && this.langData.current && this.themeData.learning.link[this.langData.current.code].tongue.slug;
	}

	changeCurrentLanguage (code: string, init: boolean) {
		// console.log('app.component::changeCurrentLanguage', code);
		this.seoService.applyCurrentLang(code);
		let needParam = false;
		this.languageService.changeTranslation(code);
		let i18nRoute: string;
		ROUTES_CONFIG.some((route: any) => {
			for (const key in route.paths) {
				if (route.paths.hasOwnProperty(key)) {
					if (route.paths[key] === this.cpntData.currentUrl) {
						needParam = !!route.urlParam;
						i18nRoute = route.paths[code];
						return true;
					}
				}
			}
		});
		if (!i18nRoute && init) {
			i18nRoute = ROUTES_CONFIG.find((item) => item.name === 'home').paths[code];
			this.router.navigate([code, i18nRoute]);
		} else if (!init) {
			const urlTree = [code, i18nRoute];
			if (needParam) { urlTree.push(this.currentThemeSlug); }
			this.router.navigate(urlTree);
		}
	}

	changeLearningLanguage (code: string) {
		this.languageService.chooseLearningLang(code);
	}

	// Shows and hides the loading spinner during RouterEvent changes
	navigationInterceptor (event: RouterEvent): void {
		if (event instanceof NavigationStart) {
			this.cpntData.loadingRoute = true;
		}
		if (event instanceof NavigationEnd) {
			const urlParts = event.urlAfterRedirects.split('/');
			this.cpntData.currentUrl = decodeURIComponent(urlParts[2] || urlParts[1]);
			this.cpntData.loadingRoute = false;
			ga('set', 'page', event.urlAfterRedirects);
			ga('send', 'pageview');
			if (!this.initilized) {
				this.changeCurrentLanguage(this.localize.parser.currentLang, true);
				this.initilized = true;
			}
		}

		// Set loading state to false in both of the below events to hide the spinner in case a request fails
		if (event instanceof NavigationCancel) {
			this.cpntData.loadingRoute = false;
		}
		if (event instanceof NavigationError) {
			this.cpntData.loadingRoute = false;
		}
	}

	ngOnDestroy () {
		this.routeSubscription.unsubscribe();
	}
}
