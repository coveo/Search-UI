import { history } from 'coveo.analytics';
import { findLastIndex } from 'underscore';
import { Cookie } from '../../utils/CookieUtils';

export class AnalyticsInformation {
  public get visitorId() {
    return Cookie.get('visitorId') || null;
  }

  public set visitorId(id: string) {
    Cookie.set('visitorId', id);
  }

  public get clientId() {
    return Cookie.get('clientId') || null;
  }

  public set clientId(id: string) {
    Cookie.set('clientId', id);
  }

  public get lastPageId() {
    const store = new history.HistoryStore();
    const actions = store.getHistory() as { name: string; value?: string }[];
    const pageViewActionId = findLastIndex(actions, action => action.name === 'PageView');
    if (pageViewActionId === -1) {
      return null;
    }
    return actions[pageViewActionId].value;
  }

  public get location() {
    return document.location.href;
  }

  public get referrer() {
    return document.referrer;
  }

  public clearCookies() {
    Cookie.erase('visitorId');
    Cookie.erase('clientId');
    Cookie.erase('visitId');
  }
}
