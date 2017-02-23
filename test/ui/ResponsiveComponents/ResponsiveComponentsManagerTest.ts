import { $$, Dom } from '../../../src/utils/Dom';
import { ResponsiveComponentsManager, IResponsiveComponent } from '../../../src/ui/ResponsiveComponents/ResponsiveComponentsManager';
import * as Mock from '../../MockEnvironment';
import { SearchInterface, ISearchInterfaceOptions } from '../../../src/ui/SearchInterface/SearchInterface';

export function ResponsiveComponentsManagerTest() {

  let root: Dom;
  let handleResizeEvent: any;
  let responsiveComponentsManager: ResponsiveComponentsManager;
  let responsiveComponent: any;
  let component: any;

  describe('ResponsiveComponentsManager', () => {
    beforeEach(() => {
      let searchInterfaceMock = Mock.optionsSearchInterfaceSetup<SearchInterface, ISearchInterfaceOptions>(SearchInterface, {
        enableAutomaticResponsiveMode: true
      });
      searchInterfaceMock.cmp.isNewDesign = () => true;
      root = $$(searchInterfaceMock.cmp.root);
      handleResizeEvent = jasmine.createSpy('handleResizeEvent');
      responsiveComponent = function () {
        this.needDrodpownWrapper = () => { };
        this.handleResizeEvent = handleResizeEvent;
      };
      component = {};
      responsiveComponentsManager = new ResponsiveComponentsManager(root);
    });

    it('calls handle resize event when resize listener is called', (done) => {
      root.width = () => 400;
      responsiveComponentsManager.register(responsiveComponent, root, 'id', component, {});

      responsiveComponentsManager.resizeListener();

      setTimeout(() => {
        expect(handleResizeEvent).toHaveBeenCalled();
        done();
      }, ResponsiveComponentsManager.RESIZE_DEBOUNCE_DELAY + 1);

    });

    it('does not calls handle resize event when resize listener is called and width is zero', (done) => {
      root.width = () => 0;
      responsiveComponentsManager.register(responsiveComponent, root, 'id', component, {});

      responsiveComponentsManager.resizeListener();

      setTimeout(() => {
        expect(handleResizeEvent).not.toHaveBeenCalled();
        done();
      }, ResponsiveComponentsManager.RESIZE_DEBOUNCE_DELAY + 1);

    });
  });
}
