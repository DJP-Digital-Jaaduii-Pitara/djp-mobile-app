import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { ComponentsModule } from './components/components.module';
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { StorageService } from './services/storage.service';
import { DbService } from './services/db.service';
import { AppInitializeService } from './services/appInitialize.service';
import { TelemetryService } from './services/telemetry/telemetry.service';

export function translateHttpLoaderFactory(httpClient: HttpClient) {
  return new TranslateHttpLoader(httpClient, './assets/i18n/', '.json');
}
@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule, 
    IonicModule.forRoot(), 
    AppRoutingModule,
    HttpClientModule,
    TranslateModule.forRoot({
      loader: {
          provide: TranslateLoader,
          useFactory: (translateHttpLoaderFactory),
          deps: [HttpClient]
      }
    }),
    ComponentsModule],
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    StorageService,
    DbService,
    AppInitializeService,
    TelemetryService
  ],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})

export class AppModule {
  constructor(private translate: TranslateService) {
    this.setDefaultLanguage();
  }

  private setDefaultLanguage() {
    this.translate.setDefaultLang('en');
  }
}
