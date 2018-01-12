var FancyListView = require("nativescript-fancy-list-view").FancyListView;
var fancyListView = new FancyListView();

describe("greet function", function() {
    it("exists", function() {
        expect(fancyListView.greet).toBeDefined();
    });

    it("returns a string", function() {
        expect(fancyListView.greet()).toEqual("Hello, NS");
    });
});