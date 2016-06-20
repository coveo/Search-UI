/// <reference path="../Test.ts" />
module Coveo {
  import NoopComponent = Coveo.Components.NoopComponent;
  describe('Tab', function () {
    var test: Mock.IBasicComponentSetup<Tab>;

    beforeEach(function () {
      test = Mock.optionsComponentSetup<Tab, ITabOptions>(Tab, {
        id: 'testingtabid',
        caption: 'caption test tab'
      });
    })

    afterEach(function () {
      test = null;
    })

    describe('exposes options', function () {

      it('tab id can be set, and is sent in the query, only if selected', function () {
        test = Mock.advancedComponentSetup<Tab>(Tab, new Mock.AdvancedComponentSetupOptions(undefined, {
          id: 'niceid'
        }, (env: Mock.MockEnvironmentBuilder) => {
          return env.withLiveQueryStateModel();
        }));

        var simulation = Simulate.query(test.env);
        expect(simulation.queryBuilder.build().tab).toBeUndefined();
        test.cmp.select();
        simulation = Simulate.query(test.env);
        expect(simulation.queryBuilder.build().tab).toBe('niceid');
      })

      it('expression is set on the constant part of the query, only if selected', function () {
        test = Mock.advancedComponentSetup<Tab>(Tab, new Mock.AdvancedComponentSetupOptions(undefined, {
          id: 'niceid',
          expression: '@foo==bar'
        }, (env: Mock.MockEnvironmentBuilder) => {
          return env.withLiveQueryStateModel();
        }));
        var simulation = Simulate.query(test.env);
        expect(simulation.queryBuilder.build().cq).toBeUndefined();
        test.cmp.select();
        simulation = Simulate.query(test.env);
        expect(simulation.queryBuilder.build().cq).toBe('@foo==bar');
      })

      it('expression is set on the advanced part of the query, only if selected and constant is false', function () {
        test = Mock.advancedComponentSetup<Tab>(Tab, new Mock.AdvancedComponentSetupOptions(undefined, {
          id: 'niceid',
          expression: '@foo==bar',
          constant: false
        }, (env: Mock.MockEnvironmentBuilder) => {
          return env.withLiveQueryStateModel();
        }));
        var simulation = Simulate.query(test.env);
        expect(simulation.queryBuilder.build().aq).toBeUndefined();
        test.cmp.select();
        simulation = Simulate.query(test.env);
        expect(simulation.queryBuilder.build().aq).toBe('@foo==bar');
      })

      it('caption can specify the caption for the element', function () {
        test = Mock.optionsComponentSetup<Tab, ITabOptions>(Tab, {
          caption: 'yo man'
        })

        expect($$(test.cmp.element).text()).toBe('yo man');
      })

      it('icon can be added on a tab', function () {
        test = Mock.optionsComponentSetup<Tab, ITabOptions>(Tab, {
          icon: 'yoman'
        })
        var icn = $$(test.cmp.element).find('.coveo-icon');
        expect($$(icn).hasClass('yoman')).toBe(true);
      })

      it('endpoint can be set on a tab, or take default otherwise', function () {
        var ep = new Coveo.SearchEndpoint({ restUri: 'test' });
        Coveo.SearchEndpoint.endpoints['testing'] = ep;
        test = Mock.optionsComponentSetup<Tab, ITabOptions>(Tab, {
          endpoint: ep
        })
        expect(test.cmp.options.endpoint).toBe(ep);
        Coveo.SearchEndpoint.endpoints['testing'] = null;
      })

      it('enableDuplicateFiltering will be set on the query, only if selected', function () {
        test = Mock.advancedComponentSetup<Tab>(Tab, new Mock.AdvancedComponentSetupOptions(undefined, {
          id: 'niceid',
          enableDuplicateFiltering: true
        }, (env: Mock.MockEnvironmentBuilder) => {
          return env.withLiveQueryStateModel();
        }));

        var simulation = Simulate.query(test.env);
        expect(simulation.queryBuilder.build().enableDuplicateFiltering).toBe(false);

        test.cmp.select();

        simulation = Simulate.query(test.env);
        expect(simulation.queryBuilder.build().enableDuplicateFiltering).toBe(true);
      })

      it('pipeline will be set on the query, only if selected', function () {
        test = Mock.advancedComponentSetup<Tab>(Tab, new Mock.AdvancedComponentSetupOptions(undefined, {
          id: 'niceid',
          pipeline: 'foobar'
        }, (env: Mock.MockEnvironmentBuilder) => {
          return env.withLiveQueryStateModel();
        }));
        var simulation = Simulate.query(test.env);
        expect(simulation.queryBuilder.build().pipeline).toBeUndefined();

        test.cmp.select();
        simulation = Simulate.query(test.env);
        expect(simulation.queryBuilder.build().pipeline).toBe('foobar');
      })

      it('maximumAge will be set on the query, only if selected', function () {
        test = Mock.advancedComponentSetup<Tab>(Tab, new Mock.AdvancedComponentSetupOptions(undefined, {
          id: 'niceid',
          maximumAge: 321
        }, (env: Mock.MockEnvironmentBuilder) => {
          return env.withLiveQueryStateModel();
        }));

        var simulation = Simulate.query(test.env);
        expect(simulation.queryBuilder.build().maximumAge).toBeUndefined();

        test.cmp.select();
        simulation = Simulate.query(test.env);
        expect(simulation.queryBuilder.build().maximumAge).toBe(321);
      })
    })

    describe('can control inclusion of other elements', function () {
      var test2: Mock.IBasicComponentSetup<Tab>;
      var dummyCmp: Mock.IBasicComponentSetup<NoopComponent>;
      var dummyCmp2: Mock.IBasicComponentSetup<NoopComponent>;
      var elem: HTMLElement;
      var elem2: HTMLElement;

      beforeEach(function () {
        test = Mock.advancedComponentSetup<Tab>(Tab, new Mock.AdvancedComponentSetupOptions(undefined, {
          id: 'testingtabid',
          caption: 'caption test tab'
        }, (env: Mock.MockEnvironmentBuilder) => {
          return env.withLiveQueryStateModel();
        }))

        test2 = Mock.advancedComponentSetup<Tab>(Tab, new Mock.AdvancedComponentSetupOptions(undefined, {
          id: 'testingtabid2',
          caption: 'caption test tab 2'
        }, (env: Mock.MockEnvironmentBuilder) => {
          return env.withRoot(test.env.root).withLiveQueryStateModel();
        }))

        elem = document.createElement('div');
        test.env.root.appendChild(elem);
        elem2 = document.createElement('div');
        test.env.root.appendChild(elem2);

        elem.setAttribute('data-tab', 'testingtabid');
        elem2.setAttribute('data-tab', 'testingtabid2');

        dummyCmp = Mock.advancedComponentSetup<NoopComponent>(NoopComponent, new Mock.AdvancedComponentSetupOptions(undefined, undefined, (env: Mock.MockEnvironmentBuilder) => {
          return env.withRoot(test.env.root);
        }));

        dummyCmp2 = Mock.advancedComponentSetup<NoopComponent>(NoopComponent, new Mock.AdvancedComponentSetupOptions(undefined, undefined, (env: Mock.MockEnvironmentBuilder) => {
          return env.withRoot(test.env.root);
        }));

        dummyCmp.cmp.element.setAttribute('data-tab', 'testingtabid');
        dummyCmp2.cmp.element.setAttribute('data-tab', 'testingtabid2');
      })

      afterEach(function () {
        test2 = null;
        dummyCmp = null;
        dummyCmp2 = null;
        elem = null;
        elem2 = null;
      })

      it('should hide and show elements if selected', function () {
        test.cmp.select();
        Simulate.query(test.env);
        expect($$(elem2).hasClass('coveo-tab-disabled')).toBe(true);
        expect($$(dummyCmp2.cmp.element).hasClass('coveo-tab-disabled')).toBe(true);
        expect($$(dummyCmp.cmp.element).hasClass('coveo-tab-disabled')).toBe(false);
        expect($$(elem).hasClass('coveo-tab-disabled')).toBe(false);

        test2.cmp.select();
        Simulate.query(test.env);
        expect($$(elem2).hasClass('coveo-tab-disabled')).toBe(false);
        expect($$(dummyCmp2.cmp.element).hasClass('coveo-tab-disabled')).toBe(false);
        expect($$(dummyCmp.cmp.element).hasClass('coveo-tab-disabled')).toBe(true);
        expect($$(elem).hasClass('coveo-tab-disabled')).toBe(true);
      })

      it('should disable or enable component if selected', function () {
        test.cmp.select();
        Simulate.query(test.env);
        expect(dummyCmp.cmp.disabled).toBe(false);
        expect(dummyCmp2.cmp.disabled).toBe(true);

        test2.cmp.select();
        Simulate.query(test.env);
        expect(dummyCmp.cmp.disabled).toBe(true);
        expect(dummyCmp2.cmp.disabled).toBe(false);
      })

      it('should disable or enable component if created under a div with data-tab', function () {

        // remove the attribute directly on the component, and put them under another div which has the attribute data-tab
        dummyCmp.cmp.element.removeAttribute('data-tab');
        dummyCmp2.cmp.element.removeAttribute('data-tab');
        elem.appendChild(dummyCmp.cmp.element);
        elem2.appendChild(dummyCmp2.cmp.element);

        test.cmp.select();
        Simulate.query(test.env);
        expect(dummyCmp.cmp.disabled).toBe(false);
        expect(dummyCmp2.cmp.disabled).toBe(true);

        test2.cmp.select();
        Simulate.query(test.env);
        expect(dummyCmp.cmp.disabled).toBe(true);
        expect(dummyCmp2.cmp.disabled).toBe(false);
      })

      it('can specify multiple tab for one component', function () {
        dummyCmp.cmp.element.setAttribute('data-tab', 'testingtabid,testingtabid2');
        test.cmp.select();
        Simulate.query(test.env);
        expect(dummyCmp.cmp.disabled).toBe(false);

        test2.cmp.select();
        Simulate.query(test.env);
        expect(dummyCmp.cmp.disabled).toBe(false);
      })

      it('can specify not to be included in a tab for one component', function () {
        dummyCmp.cmp.element.removeAttribute('data-tab');
        dummyCmp.cmp.element.setAttribute('data-tab-not', 'testingtabid');

        test.cmp.select();
        Simulate.query(test.env);
        expect(dummyCmp.cmp.disabled).toBe(true);

        test2.cmp.select();
        Simulate.query(test.env);
        expect(dummyCmp.cmp.disabled).toBe(false);
      })

      it('can specify not to be included in multiple tabs for one component', function () {
        dummyCmp.cmp.element.removeAttribute('data-tab');
        dummyCmp.cmp.element.setAttribute('data-tab-not', 'testingtabid,testingtabid2');

        test.cmp.select();
        Simulate.query(test.env);
        expect(dummyCmp.cmp.disabled).toBe(true);

        test2.cmp.select();
        Simulate.query(test.env);
        expect(dummyCmp.cmp.disabled).toBe(true);
      })
    })

    it('should trigger a query on selection', function () {
      test.cmp.select();
      expect(test.env.queryController.executeQuery).toHaveBeenCalled();
    })

    it('should trigger an analytics event on selection', function () {
      test.cmp.select();
      expect(test.env.usageAnalytics.logSearchEvent).toHaveBeenCalledWith(analyticsActionCauseList.interfaceChange, { interfaceChangeTo: 'testingtabid' });
    })
  })
}
