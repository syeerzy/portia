import Ember from 'ember';
import SaveSpiderMixin from '../mixins/save-spider-mixin';
const { computed, inject: { service } } = Ember;

export default Ember.Component.extend(SaveSpiderMixin, {
    routing: service('-routing'),
    tagName: '',

    spider: null,

    followPatternOptions: [
        {
            value: 'auto',
            label: '自动',
            description: `使用开始url和示例url来教蜘蛛最好的链接`
        },
        {
            value: 'all',
            label: '当前域',
            description: `跟踪所有与起始或示例url匹配的域或子域的链接`
        },
        {
            value: 'none',
            label: "不抽取",
            description: `仅尝试从开始url抽取数据。可以用feed和生成的url组合在一起吗`
        },
        {
            value: 'patterns',
            label: '配置',
            description: `为蜘蛛创造图案，以跟随或不跟随，并指引你的蜘蛛针点的准确性`
        },
    ],

    linksToFollow: computed('spider.linksToFollow', {
        get() {
            return this.followPatternOptions.findBy('value', this.get('spider.linksToFollow'));
        },

        set(key, value) {
            this.set('spider.linksToFollow', value.value);
            return value;
        }
    }),

    actions: {
        saveSpider() {
            this.saveSpider().then(() => {
                if (this.get('linksToFollow.value') === 'patterns') {
                    this.get('routing').transitionTo('projects.project.spider.link-options');
                } else if (this.get('linksToFollow.value') === 'none' &&
                        this.get('routing.currentRouteName').endsWith('link-options')) {
                    this.get('routing').transitionTo('projects.project.spider');
                }
            });
        }
    }
});
