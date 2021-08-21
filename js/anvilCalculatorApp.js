Vue.component('tool-selector', {
    props: ['title', 'allTools', 'inputTool'],
    template: document.getElementById("toolSelectorView").innerHTML
});


Vue.component('anvil-calculator', {
    props: [],
    template: document.getElementById("anvilCalculator").innerHTML,
    data: () => {
        return {
            calculator: new Calculator(new DataProvider())
        };
    }
});

Vue.component('optimal-enchant-order-calculator', {
    props: [],
    template: document.getElementById("optimalEnchantOrderCalculator").innerHTML,
    data: () => {
        return {
            orderCalculator: new OptimalEnchantOrderCalculator(new DataProvider())
        };
    }
});

let anvilCalculatorApp = new Vue({
    el: '#anvilCalculatorApp',
    data: {
        isVisibleAnvilCalculator: true,
        isOptimalEnchantOrderCalculator: false,
    },
    methods: {
        selectAnvilCalculator: function () {
            this.isVisibleAnvilCalculator = true;
            this.isOptimalEnchantOrderCalculator = false;
        },
        selectOptimalEnchantOrderCalculator: function () {
            this.isVisibleAnvilCalculator = false;
            this.isOptimalEnchantOrderCalculator = true;
        },
    }
});