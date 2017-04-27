import * as Mock from '../MockEnvironment';
import { SearchInterface } from '../../src/ui/SearchInterface/SearchInterface';
import { NoopAnalyticsClient } from '../../src/ui/Analytics/NoopAnalyticsClient';
import { QueryController } from '../../src/controllers/QueryController';
import { QueryStateModel } from '../../src/models/QueryStateModel';
import { ComponentOptionsModel } from '../../src/models/ComponentOptionsModel';
import { ComponentStateModel } from '../../src/models/ComponentStateModel';
import { Querybox } from '../../src/ui/Querybox/Querybox';
import { LiveAnalyticsClient } from '../../src/ui/Analytics/LiveAnalyticsClient';
import { $$ } from '../../src/utils/Dom';
import { QueryEvents } from '../../src/events/QueryEvents';
import { Component } from '../../src/ui/Base/Component';
import { HistoryController } from '../../src/controllers/HistoryController';
import { LocalStorageHistoryController } from '../../src/controllers/LocalStorageHistoryController';
import { Simulate } from '../Simulate';
import { Debug } from '../../src/ui/Debug/Debug';
import { FakeResults } from '../Fake';
import _ = require('underscore');

export function SearchInterfaceTest() {
  describe('SearchInterface', () => {

    let cmp: SearchInterface;

    beforeEach(function () {
      cmp = new SearchInterface(document.createElement('div'));
    });

    afterEach(function () {
      cmp = null;
    });

    it('should create an analytics client', () => {
      expect(cmp.usageAnalytics instanceof Coveo['NoopAnalyticsClient']).toBe(true);
    });

    it('should create a query controller', () => {
      expect(cmp.queryController instanceof QueryController).toBe(true);
    });

    it('should create a query state model', () => {
      expect(cmp.queryStateModel instanceof QueryStateModel).toBe(true);
    });

    it('should create a component options model', () => {
      expect(cmp.componentOptionsModel instanceof ComponentOptionsModel).toBe(true, 'Not a component options model');
    });

    it('should create a component state model', () => {
      expect(cmp.componentStateModel instanceof ComponentStateModel).toBe(true, 'Not a component state model');
    });

    it('should create a search interface', () => {
      expect(cmp instanceof SearchInterface).toBe(true);
    });

    it('should set the root as itself', () => {
      expect(cmp.root).toBe(cmp.element, 'Not an element');
    });

    it('should return is new design properly', function () {
      expect(cmp.isNewDesign()).toBe(false);
      let newDesignDiv = document.createElement('div');
      newDesignDiv.setAttribute('data-design', 'new');
      let newDesignCmp = new SearchInterface(newDesignDiv);
      expect(newDesignCmp.isNewDesign()).toBe(true);
    });

    it('should allow to attach and detach component', function () {
      let cmpToAttach = Mock.mockComponent(Querybox);
      cmp.attachComponent('Querybox', cmpToAttach);
      expect(cmp.getComponents('Querybox')).toContain(cmpToAttach);
      cmp.detachComponent('Querybox', cmpToAttach);
      expect(cmp.getComponents('Querybox')).not.toContain(cmpToAttach);
    });

    describe('usage analytics', function () {
      let searchInterfaceDiv: HTMLDivElement;
      let analyticsDiv: HTMLDivElement;

      beforeEach(function () {
        searchInterfaceDiv = document.createElement('div');
        analyticsDiv = document.createElement('div');
        analyticsDiv.className = 'CoveoAnalytics';
      });

      afterEach(function () {
        searchInterfaceDiv = null;
        analyticsDiv = null;
      });

      it('should initialize if found inside the root', function () {
        searchInterfaceDiv.appendChild(analyticsDiv);
        let searchInterface = new SearchInterface(searchInterfaceDiv);
        expect(searchInterface.usageAnalytics instanceof Coveo['LiveAnalyticsClient']).toBe(true);
      });
    });

    it('should set the correct css class on multiple section, if available', () => {
      let facetSection = $$('div', { className: 'coveo-facet-column' });
      let resultsSection = $$('div', { className: 'coveo-results-column' });
      cmp.element.appendChild(facetSection.el);
      cmp.element.appendChild(resultsSection.el);
      $$(cmp.element).trigger(QueryEvents.querySuccess, {
        results: FakeResults.createFakeResults(0)
      });
      expect(facetSection.hasClass('coveo-no-results')).toBe(true);
      expect(resultsSection.hasClass('coveo-no-results')).toBe(true);
      $$(cmp.element).trigger(QueryEvents.querySuccess, {
        results: FakeResults.createFakeResults(10)
      });
      expect(facetSection.hasClass('coveo-no-results')).toBe(false);
      expect(resultsSection.hasClass('coveo-no-results')).toBe(false);
      $$(cmp.element).trigger(QueryEvents.queryError);
      expect(facetSection.hasClass('coveo-no-results')).toBe(true);
      expect(resultsSection.hasClass('coveo-no-results')).toBe(true);
      $$(cmp.element).trigger(QueryEvents.querySuccess, {
        results: FakeResults.createFakeResults(10)
      });
      expect(facetSection.hasClass('coveo-no-results')).toBe(false);
      expect(resultsSection.hasClass('coveo-no-results')).toBe(false);
    });

    describe('exposes options', function () {
      let div: HTMLDivElement;
      let mockWindow: Window;
      let env: Mock.IMockEnvironment;

      beforeEach(() => {
        div = document.createElement('div');
        env = new Mock.MockEnvironmentBuilder().withRoot(div).build();
        mockWindow = Mock.mockWindow();
      });

      afterEach(() => {
        div = null;
        env = null;
        mockWindow = null;
      });

      it('enableHistory allow to enable history in the url', function () {
        let cmp = new SearchInterface(div, {
          enableHistory: true
        }, undefined, mockWindow);
        expect(Component.resolveBinding(cmp.element, HistoryController)).toBeDefined();
      });

      it('enableHistory can be disabled and won\'t save history in the url', function () {
        let cmp = new SearchInterface(div, {
          enableHistory: false
        }, undefined, mockWindow);
        expect(Component.resolveBinding(cmp.element, HistoryController)).toBeUndefined();
      });

      it('useLocalStorageForHistory allow to use local storage for history', function () {
        let cmp = new SearchInterface(div, {
          enableHistory: true,
          useLocalStorageForHistory: true
        }, undefined, mockWindow);
        expect(Component.resolveBinding(cmp.element, HistoryController)).toBeUndefined();
        expect(Component.resolveBinding(cmp.element, LocalStorageHistoryController)).toBeDefined();
      });

      it('useLocalStorageForHistory allow to use local storage for history, but not if history is disabled', function () {
        let cmp = new SearchInterface(div, {
          enableHistory: false,
          useLocalStorageForHistory: true
        }, undefined, mockWindow);
        expect(Component.resolveBinding(cmp.element, HistoryController)).toBeUndefined();
        expect(Component.resolveBinding(cmp.element, LocalStorageHistoryController)).toBeUndefined();
      });

      it('resultsPerPage allow to specify the number of results in query', function () {
        new SearchInterface(div, { resultsPerPage: 123 }, undefined, mockWindow);
        let simulation = Simulate.query(env);
        expect(simulation.queryBuilder.numberOfResults).toBe(123);
      });

      it('resultsPerPage should be 10 by default', function () {
        new SearchInterface(div, undefined, undefined, mockWindow);
        let simulation = Simulate.query(env);
        expect(simulation.queryBuilder.numberOfResults).toBe(10);
      });

      it('excerptLength allow to specify the excerpt length of results in a query', function () {
        new SearchInterface(div, {
          excerptLength: 123
        }, undefined, mockWindow);
        let simulation = Simulate.query(env);
        expect(simulation.queryBuilder.excerptLength).toBe(123);
      });

      it('excerptLength should be 200 by default', function () {
        new SearchInterface(div, undefined, undefined, mockWindow);
        let simulation = Simulate.query(env);
        expect(simulation.queryBuilder.excerptLength).toBe(200);
      });

      it('expression allow to specify and advanced expression to add to the query', function () {
        new SearchInterface(div, { expression: 'foobar' }, undefined, mockWindow);
        let simulation = Simulate.query(env);
        expect(simulation.queryBuilder.advancedExpression.build()).toBe('foobar');
      });

      it('expression should not be added if empty', function () {
        new SearchInterface(div, { expression: '' }, undefined, mockWindow);
        let simulation = Simulate.query(env);
        expect(simulation.queryBuilder.advancedExpression.build()).toBeUndefined();
      });

      it('expression should be empty by default', function () {
        new SearchInterface(div, undefined, undefined, mockWindow);
        let simulation = Simulate.query(env);
        expect(simulation.queryBuilder.advancedExpression.build()).toBeUndefined();
      });

      it('filterField allow to specify a filtering field', function () {
        new SearchInterface(div, { filterField: '@foobar' }, undefined, mockWindow);
        let simulation = Simulate.query(env);
        expect(simulation.queryBuilder.filterField).toBe('@foobar');
      });

      it('filterField should be empty by default', function () {
        new SearchInterface(div, undefined, mockWindow);
        let simulation = Simulate.query(env);
        expect(simulation.queryBuilder.filterField).toBeUndefined();
      });


      it('timezone allow to specify a timezone in the query', function () {
        new SearchInterface(div, { timezone: 'aa-bb' }, undefined, mockWindow);
        let simulation = Simulate.query(env);
        expect(simulation.queryBuilder.timezone).toBe('aa-bb');
      });

      it('enableDebugInfo should create a debug component', function (done) {
        let cmp = new SearchInterface(div, {
          enableDebugInfo: true
        }, undefined, mockWindow);
        _.defer(() => {
          expect(Component.resolveBinding(cmp.element, Debug)).toBeDefined();
          done();
        });
      });

      it('enableDebugInfo disabled should not create a debug component', function (done) {
        let cmp = new SearchInterface(div, {
          enableDebugInfo: false
        }, undefined, mockWindow);
        _.defer(() => {
          expect(Component.resolveBinding(cmp.element, Debug)).toBeUndefined();
          done();
        });
      });

      it('enableCollaborativeRating allow to specify the collaborative rating in the query', function () {
        new SearchInterface(div, { enableCollaborativeRating: true }, undefined, mockWindow);
        let simulation = Simulate.query(env);
        expect(simulation.queryBuilder.enableCollaborativeRating).toBe(true);
      });

      it('enableCollaborativeRating to false allow to disable the collaborative rating in the query', function () {
        new SearchInterface(div, { enableCollaborativeRating: false }, undefined, mockWindow);
        let simulation = Simulate.query(env);
        expect(simulation.queryBuilder.enableCollaborativeRating).toBe(false);
      });

      it('enableDuplicateFiltering allow to filter duplicate in the query', function () {
        new SearchInterface(div, { enableDuplicateFiltering: true }, undefined, mockWindow);
        let simulation = Simulate.query(env);
        expect(simulation.queryBuilder.enableDuplicateFiltering).toBe(true);
      });

      it('enableDuplicateFiltering to false allow to disable the filter duplicate in the query', function () {
        new SearchInterface(div, { enableDuplicateFiltering: false }, undefined, mockWindow);
        let simulation = Simulate.query(env);
        expect(simulation.queryBuilder.enableDuplicateFiltering).toBe(false);
      });

      it('pipeline allow to specify the pipeline to use in a query', function () {
        new SearchInterface(div, { pipeline: 'foobar' }, undefined, mockWindow);
        let simulation = Simulate.query(env);
        expect(simulation.queryBuilder.pipeline).toBe('foobar');
      });

      it('maximumAge allow to specify the duration of the cache in a query', function () {
        new SearchInterface(div, { maximumAge: 123 }, undefined, mockWindow);
        let simulation = Simulate.query(env);
        expect(simulation.queryBuilder.maximumAge).toBe(123);
      });
    });
  });
}
