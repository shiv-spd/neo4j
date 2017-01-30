import { Neo4jClientPage } from './app.po';

describe('neo4j-client App', function() {
  let page: Neo4jClientPage;

  beforeEach(() => {
    page = new Neo4jClientPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
