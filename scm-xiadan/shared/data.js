// 共享数据存储 - 模拟后端数据库

// ==================== 售后状态常量定义 ====================
const AFTERSALE_STATUS = {
    PENDING: 'pending',           // 待审核
    APPROVED: 'approved',         // 审核通过
    REJECTED: 'rejected',         // 审核拒绝
    WAITING_RETURN: 'waiting_return', // 待寄回
    RETURNING: 'returning',       // 退货中
    RECEIVED: 'received',         // 已收货
    RESHIPPING: 'reshipping',     // 重新发货中
    COMPLETED: 'completed'        // 已完成
};

// 售后类型常量
const AFTERSALE_TYPE = {
    REFUND_ONLY: 'refund_only',     // 仅退款
    RETURN_REFUND: 'return_refund', // 退货退款
    EXCHANGE: 'exchange'            // 换货
};

// 售后原因选项列表
const AFTERSALE_REASONS = [
    { code: 'quality_issue', label: '商品质量问题', description: '商品存在质量缺陷或功能问题' },
    { code: 'not_as_described', label: '商品与描述不符', description: '收到的商品与页面描述不一致' },
    { code: 'damaged', label: '收到商品破损', description: '商品在运输过程中损坏' },
    { code: 'wrong_item', label: '发错货/漏发', description: '收到的商品与订单不符或缺少商品' },
    { code: 'no_longer_needed', label: '不想要了', description: '个人原因不再需要该商品' },
    { code: 'other', label: '其他原因', description: '其他未列出的原因' }
];

// 退货仓库地址配置
const RETURN_WAREHOUSES = [
    {
        id: 'WH001',
        name: '北京退货仓库',
        contact: '售后仓库',
        phone: '400-123-4567',
        province: '北京市',
        city: '北京市',
        district: '朝阳区',
        address: '北京市朝阳区建国路88号退货仓库A区',
        isDefault: true
    },
    {
        id: 'WH002',
        name: '上海退货仓库',
        contact: '售后仓库',
        phone: '400-123-4568',
        province: '上海市',
        city: '上海市',
        district: '浦东新区',
        address: '上海市浦东新区陆家嘴环路1000号退货仓库B区',
        isDefault: false
    },
    {
        id: 'WH003',
        name: '广州退货仓库',
        contact: '售后仓库',
        phone: '400-123-4569',
        province: '广东省',
        city: '广州市',
        district: '天河区',
        address: '广东省广州市天河区天河路385号退货仓库C区',
        isDefault: false
    }
];

// 快递公司列表
const EXPRESS_COMPANIES = [
    { code: 'SF', name: '顺丰快递' },
    { code: 'YTO', name: '圆通快递' },
    { code: 'ZTO', name: '中通快递' },
    { code: 'STO', name: '申通快递' },
    { code: 'YD', name: '韵达快递' },
    { code: 'JD', name: '京东物流' },
    { code: 'EMS', name: 'EMS' },
    { code: 'OTHER', name: '其他' }
];

// ==================== 售后配置 ====================
const AFTERSALE_CONFIG = {
    // 时效规则
    timing: {
        applyDeadlineDays: 15,        // 售后申请期限（签收后可申请售后的天数）
        returnDeadlineDays: 7,        // 退货寄回期限（审核通过后需寄回商品的天数）
        autoApproveHours: 48,         // 超时自动通过（小时，0=关闭自动审核）
        exchangeAutoConfirmDays: 7,   // 换货自动确认（换货发货后自动确认收货天数）
        reviewDeadlineDays: 3         // 审核处理时效（预计审核处理时间，工作日）
    },
    
    // 运费规则
    freight: {
        pendingShipRefundFreight: true,      // 待发货是否退运费
        compensationMethod: 'reimburse',     // 补贴方式: cod(到付)/reimburse(先付后补)/fixed(固定补贴)
        fixedCompensationAmount: 12,         // 固定补贴金额（元）
        maxCompensationAmount: 30            // 最高补贴金额（元，先付后补模式）
    },
    
    // 售后原因分类（决定运费责任）
    reasons: {
        supplier: [                          // 供应商责任（运费由供应商承担）
            '商品质量问题',
            '商品与描述不符',
            '收到商品破损',
            '发错货/漏发'
        ],
        buyer: [                             // 买家责任（运费由买家承担）
            '不想要了',
            '七天无理由',
            '其他原因'
        ]
    },
    
    // 功能开关
    features: {
        enableExchange: false,                // 支持换货（本期暂不支持）
        enableRefundOnlyAfterShip: true,     // 已发货支持仅退款（协商无需退货）
        autoApproveEnabled: true,            // 超时自动审核
        qualityCheckRequired: true           // 退货需质检
    },
    
    // 结算规则
    settlement: {
        delayDays: 7,                        // 结算延迟天数（确认收货后多久结算）
        refundMethod: 'chargeback',          // 退款处理方式: chargeback(冲账记录)/direct(直接回退)
        negativeBalanceAllowed: true,        // 允许负余额
        autoRecoverFromNextSettlement: true  // 从下次结算自动扣回
    }
};

// ==================== 资金清分配置 V2.0 ====================
const CLEARING_CONFIG = {
    // 对商家的分账比例（合计100%）- SPU级别配置
    platformRate: 0.70,           // 平台货款（贸易公司代收）70%
    operationRate: 0.10,          // 代运营公司 10%
    merchantRate: 0.20,           // 商家毛利 20%（门店+连锁总部共享）
    
    // 平台内部分配比例（合计100%）
    tradingCompanyRate: 0.80,     // 贸易公司 80%
    distributorRate: 0.20,        // 经销商 20%（线下结算）
    
    // 推广员佣金比例（从门店毛利中扣，V2.0变更）
    directCommissionRate: 0.10,   // 直推 10%
    indirectCommissionRate: 0.05, // 间推 5%
    
    // 费率
    paymentFeeRate: 0.0038,       // 支付手续费率 0.38%
    merchantCashRetainRate: 0.10  // 商家现金保留比例 10%
};

// 品牌配置（连锁总部分成比例）- V2.0新增
const BRAND_CONFIG = {
    '伊智美妆': {
        brandName: '伊智美妆',
        headquarterShareRate: 0.10,  // 连锁总部占商家毛利的10%
        createTime: '2026-01-01'
    },
    '美丽说': {
        brandName: '美丽说',
        headquarterShareRate: 0.08,
        createTime: '2025-06-15'
    },
    '花漾年华': {
        brandName: '花漾年华',
        headquarterShareRate: 0.12,
        createTime: '2025-09-01'
    },
    '悦颜坊': {
        brandName: '悦颜坊',
        headquarterShareRate: 0.05,
        createTime: '2025-11-20'
    },
    '雅诗丽人': {
        brandName: '雅诗丽人',
        headquarterShareRate: 0.15,
        createTime: '2025-03-10'
    },
    // 默认配置（单店或未配置的品牌）
    '_default': {
        brandName: '默认',
        headquarterShareRate: 0,     // 默认0%，商家毛利全部归门店
        createTime: '2026-01-01'
    }
};

// 清分结算方式
const CLEARING_METHOD = {
    SPLIT_ACCOUNT: 'split_account',   // 空中分账
    DEPOSIT: 'deposit',               // 保证金扣除
    BALANCE: 'balance'                // 余额账户（推广员）
};

// ==================== 门店数据 ====================
const TEST_STORES = {
    'STORE001': {
        id: 'STORE001',
        name: '北京旗舰店',
        brandName: '伊智美妆',  // 品牌名称，连锁店有品牌
        isChain: true,          // 是否连锁店
        useChainDeposit: true,  // 使用连锁保证金
        headquarterShareRate: 0.10,  // V2.0: 连锁总部占商家毛利的10%（从品牌配置获取）
        code: 'BJ001',
        address: '北京市朝阳区建国路88号',
        phone: '010-12345678',
        status: 'active'
    },
    'STORE002': {
        id: 'STORE002',
        name: '上海旗舰店',
        brandName: '伊智美妆',  // 同一品牌
        isChain: true,
        useChainDeposit: true,  // 使用连锁保证金
        headquarterShareRate: 0.10,  // V2.0: 连锁总部占商家毛利的10%
        code: 'SH001',
        address: '上海市浦东新区陆家嘴环路1000号',
        phone: '021-87654321',
        status: 'active'
    },
    'STORE003': {
        id: 'STORE003',
        name: '广州旗舰店',
        brandName: '伊智美妆',  // 同一品牌
        isChain: true,
        useChainDeposit: false, // 使用门店自己的保证金
        headquarterShareRate: 0.10,  // V2.0: 连锁总部占商家毛利的10%
        code: 'GZ001',
        address: '广东省广州市天河区天河路385号',
        phone: '020-11112222',
        status: 'active'
    },
    'STORE004': {
        id: 'STORE004',
        name: '深圳旗舰店',
        brandName: '伊智美妆',
        isChain: true,
        useChainDeposit: true,
        headquarterShareRate: 0.10,
        code: 'SZ001',
        address: '广东省深圳市南山区深南大道9999号',
        phone: '0755-12345678',
        status: 'active'
    },
    'STORE005': {
        id: 'STORE005',
        name: '成都旗舰店',
        brandName: '伊智美妆',
        isChain: true,
        useChainDeposit: true,
        headquarterShareRate: 0.10,
        code: 'CD001',
        address: '四川省成都市锦江区春熙路88号',
        phone: '028-12345678',
        status: 'active'
    },
    'STORE006': {
        id: 'STORE006',
        name: '杭州旗舰店',
        brandName: '伊智美妆',
        isChain: true,
        useChainDeposit: true,
        headquarterShareRate: 0.10,
        code: 'HZ001',
        address: '浙江省杭州市西湖区延安路100号',
        phone: '0571-12345678',
        status: 'active'
    },
    'STORE007': {
        id: 'STORE007',
        name: '武汉旗舰店',
        brandName: '伊智美妆',
        isChain: true,
        useChainDeposit: true,
        headquarterShareRate: 0.10,
        code: 'WH001',
        address: '湖北省武汉市江汉区解放大道666号',
        phone: '027-12345678',
        status: 'active'
    },
    'STORE008': {
        id: 'STORE008',
        name: '西安旗舰店',
        brandName: '伊智美妆',
        isChain: true,
        useChainDeposit: true,
        headquarterShareRate: 0.10,
        code: 'XA001',
        address: '陕西省西安市碑林区南稍门十字',
        phone: '029-12345678',
        status: 'active'
    },
    'STORE009': {
        id: 'STORE009',
        name: '南京旗舰店',
        brandName: '伊智美妆',
        isChain: true,
        useChainDeposit: true,
        headquarterShareRate: 0.10,
        code: 'NJ001',
        address: '江苏省南京市玄武区中山路18号',
        phone: '025-12345678',
        status: 'active'
    },
    'STORE010': {
        id: 'STORE010',
        name: '重庆旗舰店',
        brandName: '伊智美妆',
        isChain: true,
        useChainDeposit: true,
        headquarterShareRate: 0.10,
        code: 'CQ001',
        address: '重庆市渝中区解放碑步行街1号',
        phone: '023-12345678',
        status: 'active'
    },
    // ========== 美丽说门店 ==========
    'STORE011': {
        id: 'STORE011',
        name: '美丽说·北京朝阳店',
        brandName: '美丽说',
        isChain: true,
        useChainDeposit: true,
        headquarterShareRate: 0.08,
        code: 'MLS-BJ001',
        address: '北京市朝阳区三里屯太古里',
        phone: '010-66668888',
        status: 'active'
    },
    'STORE012': {
        id: 'STORE012',
        name: '美丽说·上海徐汇店',
        brandName: '美丽说',
        isChain: true,
        useChainDeposit: true,
        headquarterShareRate: 0.08,
        code: 'MLS-SH001',
        address: '上海市徐汇区港汇广场',
        phone: '021-55556666',
        status: 'active'
    },
    'STORE013': {
        id: 'STORE013',
        name: '美丽说·深圳华强店',
        brandName: '美丽说',
        isChain: true,
        useChainDeposit: false,
        headquarterShareRate: 0.08,
        code: 'MLS-SZ001',
        address: '深圳市福田区华强北商业街',
        phone: '0755-88889999',
        status: 'active'
    },
    // ========== 花漾年华门店 ==========
    'STORE014': {
        id: 'STORE014',
        name: '花漾年华·杭州西湖店',
        brandName: '花漾年华',
        isChain: true,
        useChainDeposit: true,
        headquarterShareRate: 0.12,
        code: 'HYNH-HZ001',
        address: '杭州市西湖区武林广场',
        phone: '0571-77778888',
        status: 'active'
    },
    'STORE015': {
        id: 'STORE015',
        name: '花漾年华·南京新街口店',
        brandName: '花漾年华',
        isChain: true,
        useChainDeposit: true,
        headquarterShareRate: 0.12,
        code: 'HYNH-NJ001',
        address: '南京市玄武区新街口商圈',
        phone: '025-66667777',
        status: 'active'
    },
    'STORE016': {
        id: 'STORE016',
        name: '花漾年华·苏州园区店',
        brandName: '花漾年华',
        isChain: true,
        useChainDeposit: true,
        headquarterShareRate: 0.12,
        code: 'HYNH-SZ001',
        address: '苏州市工业园区金鸡湖商业街',
        phone: '0512-55556666',
        status: 'active'
    },
    // ========== 悦颜坊门店 ==========
    'STORE017': {
        id: 'STORE017',
        name: '悦颜坊·广州天河店',
        brandName: '悦颜坊',
        isChain: true,
        useChainDeposit: true,
        headquarterShareRate: 0.05,
        code: 'YYF-GZ001',
        address: '广州市天河区正佳广场',
        phone: '020-33334444',
        status: 'active'
    },
    'STORE018': {
        id: 'STORE018',
        name: '悦颜坊·长沙五一店',
        brandName: '悦颜坊',
        isChain: true,
        useChainDeposit: false,
        headquarterShareRate: 0.05,
        code: 'YYF-CS001',
        address: '长沙市芙蓉区五一广场',
        phone: '0731-22223333',
        status: 'active'
    },
    // ========== 雅诗丽人门店 ==========
    'STORE019': {
        id: 'STORE019',
        name: '雅诗丽人·成都春熙店',
        brandName: '雅诗丽人',
        isChain: true,
        useChainDeposit: true,
        headquarterShareRate: 0.15,
        code: 'YSLR-CD001',
        address: '成都市锦江区春熙路IFS',
        phone: '028-99998888',
        status: 'active'
    },
    'STORE020': {
        id: 'STORE020',
        name: '雅诗丽人·西安钟楼店',
        brandName: '雅诗丽人',
        isChain: true,
        useChainDeposit: true,
        headquarterShareRate: 0.15,
        code: 'YSLR-XA001',
        address: '西安市碑林区钟楼商圈',
        phone: '029-77776666',
        status: 'active'
    },
    'STORE021': {
        id: 'STORE021',
        name: '雅诗丽人·郑州二七店',
        brandName: '雅诗丽人',
        isChain: true,
        useChainDeposit: true,
        headquarterShareRate: 0.15,
        code: 'YSLR-ZZ001',
        address: '郑州市二七区二七广场',
        phone: '0371-66665555',
        status: 'active'
    },
    // ========== 独立单店 ==========
    'STORE022': {
        id: 'STORE022',
        name: '小敏美妆工作室',
        brandName: '',
        isChain: false,
        useChainDeposit: false,
        headquarterShareRate: 0,
        code: 'XM001',
        address: '武汉市洪山区光谷步行街',
        phone: '027-88887777',
        status: 'active'
    },
    'STORE023': {
        id: 'STORE023',
        name: '靓丽美肤馆',
        brandName: '',
        isChain: false,
        useChainDeposit: false,
        headquarterShareRate: 0,
        code: 'LL001',
        address: '厦门市思明区中山路',
        phone: '0592-55554444',
        status: 'active'
    },
    'STORE024': {
        id: 'STORE024',
        name: '青春美颜堂',
        brandName: '',
        isChain: false,
        useChainDeposit: false,
        headquarterShareRate: 0,
        code: 'QC001',
        address: '青岛市市南区中山路',
        phone: '0532-66665555',
        status: 'active'
    },
    'STORE025': {
        id: 'STORE025',
        name: '美肤达人',
        brandName: '',
        isChain: false,
        useChainDeposit: false,
        headquarterShareRate: 0,
        code: 'MF001',
        address: '大连市中山区友好广场',
        phone: '0411-77778888',
        status: 'active'
    }
};

// 测试账号列表 - 每个用户关联到一个门店
const TEST_USERS = {
    // ========== 北京旗舰店用户 ==========
    'U001': {
        id: 'U001',
        storeId: 'STORE001',
        name: '张三（北京店会员）',
        phone: '13812345678',
        points: 50000,  // 积分 500元
        cardBalance: 500,
        addresses: [
            { id: 'A001', name: '张三', phone: '13812345678', province: '北京市', city: '北京市', district: '朝阳区', detail: '建国路88号SOHO现代城A座1208室', isDefault: true },
            { id: 'A002', name: '张三', phone: '13812345678', province: '新疆维吾尔自治区', city: '乌鲁木齐市', district: '天山区', detail: '中山路100号', isDefault: false }
        ],
        memberCards: [
            { id: 'MC001', name: '钻石会员卡', discount: 0.85, balance: 5000, expireDate: '2027-12-31' },
            { id: 'MC002', name: '金卡会员', discount: 0.92, balance: 3000, expireDate: '2027-06-30' }
        ],
        coupons: [
            { id: 'CP001', name: '新人专享券', amount: 20, minAmount: 100, expireDate: '2026-03-31', used: false },
            { id: 'CP002', name: '满300减50券', amount: 50, minAmount: 300, expireDate: '2026-06-30', used: false },
            { id: 'CP003', name: '满500减100券', amount: 100, minAmount: 500, expireDate: '2026-12-31', used: false }
        ]
    },
    'U002': {
        id: 'U002',
        storeId: 'STORE001',
        name: '王五（北京店会员）',
        phone: '13811112222',
        points: 35000,  // 积分 350元
        cardBalance: 350,
        addresses: [
            { id: 'A005', name: '王五', phone: '13811112222', province: '北京市', city: '北京市', district: '海淀区', detail: '中关村大街1号', isDefault: true },
            { id: 'A005b', name: '王五', phone: '13811112222', province: '西藏自治区', city: '拉萨市', district: '城关区', detail: '北京中路50号', isDefault: false }
        ],
        memberCards: [
            { id: 'MC004', name: '银卡会员', discount: 0.95, balance: 2000, expireDate: '2027-12-31' },
            { id: 'MC004b', name: '储值卡', discount: 1.0, balance: 1500, expireDate: '2027-12-31' }
        ],
        coupons: [
            { id: 'CP008', name: '满200减20券', amount: 20, minAmount: 200, expireDate: '2026-06-30', used: false },
            { id: 'CP008b', name: '满100减15券', amount: 15, minAmount: 100, expireDate: '2026-08-31', used: false }
        ]
    },
    // ========== 上海旗舰店用户 ==========
    'U003': {
        id: 'U003',
        storeId: 'STORE002',
        name: '李四（上海店会员）',
        phone: '13987654321',
        points: 45000,  // 积分 450元
        cardBalance: 450,
        addresses: [
            { id: 'A003', name: '李四', phone: '13987654321', province: '上海市', city: '上海市', district: '浦东新区', detail: '陆家嘴环路1000号恒生大厦18楼', isDefault: true }
        ],
        memberCards: [
            { id: 'MC003', name: '白金会员卡', discount: 0.88, balance: 8000, expireDate: '2027-12-31' },
            { id: 'MC003b', name: '金卡会员', discount: 0.92, balance: 2500, expireDate: '2027-06-30' }
        ],
        coupons: [
            { id: 'CP005', name: '新人专享券', amount: 30, minAmount: 150, expireDate: '2026-06-30', used: false },
            { id: 'CP006', name: '满200减30券', amount: 30, minAmount: 200, expireDate: '2026-06-30', used: false },
            { id: 'CP007', name: '满400减80券', amount: 80, minAmount: 400, expireDate: '2026-12-31', used: false }
        ]
    },
    'U004': {
        id: 'U004',
        storeId: 'STORE002',
        name: '赵六（上海店会员）',
        phone: '13922223333',
        points: 28000,  // 积分 280元
        cardBalance: 280,
        addresses: [
            { id: 'A006', name: '赵六', phone: '13922223333', province: '上海市', city: '上海市', district: '静安区', detail: '南京西路100号', isDefault: true },
            { id: 'A006b', name: '赵六', phone: '13922223333', province: '青海省', city: '西宁市', district: '城中区', detail: '五四大街20号', isDefault: false }
        ],
        memberCards: [
            { id: 'MC005', name: '银卡会员', discount: 0.95, balance: 1800, expireDate: '2027-12-31' },
            { id: 'MC005b', name: '储值卡', discount: 1.0, balance: 1000, expireDate: '2027-12-31' }
        ],
        coupons: [
            { id: 'CP009', name: '满100减10券', amount: 10, minAmount: 100, expireDate: '2026-06-30', used: false },
            { id: 'CP009b', name: '满300减35券', amount: 35, minAmount: 300, expireDate: '2026-09-30', used: false }
        ]
    },
    // ========== 广州旗舰店用户 ==========
    'U005': {
        id: 'U005',
        storeId: 'STORE003',
        name: '陈七（广州店会员）',
        phone: '13633334444',
        points: 60000,  // 积分 600元
        cardBalance: 600,
        addresses: [
            { id: 'A007', name: '陈七', phone: '13633334444', province: '广东省', city: '广州市', district: '天河区', detail: '天河路385号太古汇', isDefault: true }
        ],
        memberCards: [
            { id: 'MC006', name: '钻石会员卡', discount: 0.85, balance: 6000, expireDate: '2027-12-31' },
            { id: 'MC006b', name: '金卡会员', discount: 0.90, balance: 3500, expireDate: '2027-06-30' }
        ],
        coupons: [
            { id: 'CP010', name: '满300减40券', amount: 40, minAmount: 300, expireDate: '2026-06-30', used: false },
            { id: 'CP011', name: '满500减80券', amount: 80, minAmount: 500, expireDate: '2026-12-31', used: false },
            { id: 'CP011b', name: '满200减25券', amount: 25, minAmount: 200, expireDate: '2026-08-31', used: false }
        ]
    },
    'U006': {
        id: 'U006',
        storeId: 'STORE003',
        name: '周八（广州店会员）',
        phone: '13644445555',
        points: 22000,  // 积分 220元
        cardBalance: 220,
        addresses: [
            { id: 'A008', name: '周八', phone: '13644445555', province: '广东省', city: '广州市', district: '越秀区', detail: '北京路100号', isDefault: true },
            { id: 'A008b', name: '周八', phone: '13644445555', province: '内蒙古自治区', city: '呼和浩特市', district: '新城区', detail: '中山东路88号', isDefault: false }
        ],
        memberCards: [
            { id: 'MC007', name: '银卡会员', discount: 0.95, balance: 1200, expireDate: '2027-12-31' },
            { id: 'MC007b', name: '储值卡', discount: 1.0, balance: 800, expireDate: '2027-12-31' }
        ],
        coupons: [
            { id: 'CP012', name: '新人专享券', amount: 15, minAmount: 80, expireDate: '2026-06-30', used: false },
            { id: 'CP012b', name: '满150减18券', amount: 18, minAmount: 150, expireDate: '2026-07-31', used: false }
        ]
    },
    'U007': { id: 'U007', storeId: 'STORE004', name: '孙九（深圳店会员）', phone: '13700000001', points: 1000, cardBalance: 0, addresses: [], memberCards: [], coupons: [] },
    'U008': { id: 'U008', storeId: 'STORE005', name: '吴十（成都店会员）', phone: '13700000002', points: 2000, cardBalance: 0, addresses: [], memberCards: [], coupons: [] },
    'U009': { id: 'U009', storeId: 'STORE006', name: '郑十一（杭州店会员）', phone: '13700000003', points: 3000, cardBalance: 0, addresses: [], memberCards: [], coupons: [] },
    'U010': { id: 'U010', storeId: 'STORE007', name: '王十二（武汉店会员）', phone: '13700000004', points: 4000, cardBalance: 0, addresses: [], memberCards: [], coupons: [] },
    'U011': { id: 'U011', storeId: 'STORE008', name: '冯十三（西安店会员）', phone: '13700000005', points: 5000, cardBalance: 0, addresses: [], memberCards: [], coupons: [] },
    'U012': { id: 'U012', storeId: 'STORE009', name: '陈十四（南京店会员）', phone: '13700000006', points: 6000, cardBalance: 0, addresses: [], memberCards: [], coupons: [] },
    'U013': { id: 'U013', storeId: 'STORE010', name: '褚十五（重庆店会员）', phone: '13700000007', points: 7000, cardBalance: 0, addresses: [], memberCards: [], coupons: [] }
};

// 当前门店ID
let currentStoreId = 'STORE001';

// 当前用户ID
let currentUserId = 'U001';

// ==================== 运费模板 V2.0 ====================

// 运费模板列表（独立管理，商品引用）
const FREIGHT_TEMPLATES_V2 = [
    {
        id: 'FT001',
        name: '标准运费模板（包邮）',
        description: '非偏远地区包邮，偏远地区加收',
        baseFreight: 0,
        remoteAreas: [
            { province: '新疆维吾尔自治区', freight: 10 },
            { province: '西藏自治区', freight: 15 },
            { province: '青海省', freight: 10 },
            { province: '内蒙古自治区', freight: 8 }
        ],
        isDefault: true,
        createTime: '2026-01-01'
    },
    {
        id: 'FT002',
        name: '偏远地区高运费模板',
        description: '偏远地区运费较高',
        baseFreight: 0,
        remoteAreas: [
            { province: '新疆维吾尔自治区', freight: 15 },
            { province: '西藏自治区', freight: 20 },
            { province: '青海省', freight: 15 },
            { province: '内蒙古自治区', freight: 12 },
            { province: '宁夏回族自治区', freight: 10 },
            { province: '甘肃省', freight: 10 }
        ],
        isDefault: false,
        createTime: '2026-01-01'
    },
    {
        id: 'FT003',
        name: '基础运费模板',
        description: '全国统一基础运费5元',
        baseFreight: 5,
        remoteAreas: [
            { province: '新疆维吾尔自治区', freight: 15 },
            { province: '西藏自治区', freight: 20 },
            { province: '青海省', freight: 12 }
        ],
        isDefault: false,
        createTime: '2026-01-01'
    }
];

// 不可发货地区模板列表
const NO_DELIVERY_TEMPLATES = [
    {
        id: 'ND001',
        name: '标准不发货地区',
        description: '港澳台地区不发货',
        areas: ['台湾省', '香港特别行政区', '澳门特别行政区'],
        isDefault: true,
        createTime: '2026-01-01'
    },
    {
        id: 'ND002',
        name: '特殊商品不发货地区',
        description: '港澳台及海南不发货（如香水等特殊商品）',
        areas: ['台湾省', '香港特别行政区', '澳门特别行政区', '海南省'],
        isDefault: false,
        createTime: '2026-01-01'
    },
    {
        id: 'ND003',
        name: '仅发大陆地区',
        description: '仅发中国大陆地区',
        areas: ['台湾省', '香港特别行政区', '澳门特别行政区'],
        isDefault: false,
        createTime: '2026-01-01'
    }
];

// 平台偏远地区默认配置（兼容旧代码）
const PLATFORM_REMOTE_AREAS = [
    { province: '新疆维吾尔自治区', defaultFreight: 10 },
    { province: '西藏自治区', defaultFreight: 15 },
    { province: '青海省', defaultFreight: 10 },
    { province: '内蒙古自治区', defaultFreight: 8 },
    { province: '宁夏回族自治区', defaultFreight: 8 },
    { province: '甘肃省', defaultFreight: 8 }
];

// 不发货地区默认配置（兼容旧代码）
const DEFAULT_NO_DELIVERY_AREAS = ['台湾省', '香港特别行政区', '澳门特别行政区'];

// 旧版供应商运费模板（保留兼容，后续废弃）
const FREIGHT_TEMPLATES = {
    // 供应商1: 韩国美妆供应商 - 基础运费0（包邮），偏远地区加收
    'S001': {
        supplierId: 'S001',
        baseFreight: 0,                    // 基础运费（非偏远地区免运费）
        remoteAreas: [
            { province: '新疆维吾尔自治区', freight: 10 },
            { province: '西藏自治区', freight: 15 },
            { province: '青海省', freight: 10 },
            { province: '内蒙古自治区', freight: 8 }
        ],
        noDeliveryAreas: ['台湾省', '香港特别行政区', '澳门特别行政区'],
        enabled: true,
        version: 1
    },
    // 供应商2: 日本护肤供应商 - 基础运费0（包邮），偏远地区加收
    'S002': {
        supplierId: 'S002',
        baseFreight: 0,                    // 基础运费（非偏远地区免运费）
        remoteAreas: [
            { province: '新疆维吾尔自治区', freight: 12 },
            { province: '西藏自治区', freight: 18 },
            { province: '青海省', freight: 12 },
            { province: '内蒙古自治区', freight: 10 },
            { province: '宁夏回族自治区', freight: 10 },
            { province: '甘肃省', freight: 10 }
        ],
        noDeliveryAreas: ['台湾省', '香港特别行政区', '澳门特别行政区'],
        enabled: true,
        version: 1
    },
    // 供应商3: 法国香水供应商 - 基础运费0（包邮），偏远地区加收
    'S003': {
        supplierId: 'S003',
        baseFreight: 0,                    // 基础运费（非偏远地区免运费）
        remoteAreas: [
            { province: '新疆维吾尔自治区', freight: 15 },
            { province: '西藏自治区', freight: 20 },
            { province: '青海省', freight: 15 }
        ],
        noDeliveryAreas: ['台湾省', '香港特别行政区', '澳门特别行政区', '海南省'],  // 香水不发海南
        enabled: true,
        version: 1
    }
};

const DB = {
    // 门店列表
    stores: JSON.parse(JSON.stringify(TEST_STORES)),
    
    // 当前门店
    currentStore: JSON.parse(JSON.stringify(TEST_STORES['STORE001'])),
    
    // 用户信息 - 默认使用账号1
    user: JSON.parse(JSON.stringify(TEST_USERS['U001'])),
    
    // 商家信息
    merchants: [
        { id: 'M001', name: '美妆旗舰店', brand: '伊智精选', marginRate: 15, settlementCycle: 'monthly', status: 'active' },
        { id: 'M002', name: '护肤专营店', brand: '美妆世界', marginRate: 12, settlementCycle: 'biweekly', status: 'active' },
        { id: 'M003', name: '彩妆体验店', brand: '护肤专家', marginRate: 10, settlementCycle: 'monthly', status: 'active' }
    ],
    
    // 供应商信息（V2.0：移除运费模板引用，运费模板改为商品级别配置）
    suppliers: [
        { id: 'S001', name: '韩国美妆供应商', contact: '金经理', phone: '010-1234-5678' },
        { id: 'S002', name: '日本护肤供应商', contact: '山田', phone: '010-2345-6789' },
        { id: 'S003', name: '法国香水供应商', contact: 'Pierre', phone: '010-3456-7890' }
    ],
    
    // 旧版运费模板（保留兼容，后续废弃）
    freightTemplates: JSON.parse(JSON.stringify(FREIGHT_TEMPLATES)),
    
    // 运费模板变更日志
    freightTemplateLogs: [],
    
    // 原商品库（供应链侧的最小发货单位）
    sourceProducts: [
        { id: 'SP001', name: '韩国面膜单片', unit: '片', supplierId: 'S001', supplierProductCode: 'KR-MASK-001', supplyPrice: 7, img: '🧴', status: 'active' },
        { id: 'SP002', name: '日本精华液30ml', unit: '瓶', supplierId: 'S002', supplierProductCode: 'JP-ESS-001', supplyPrice: 110, img: '✨', status: 'active' },
        { id: 'SP003', name: '法国香水5ml', unit: '瓶', supplierId: 'S003', supplierProductCode: 'FR-PERF-001', supplyPrice: 60, img: '🌸', status: 'active' },
        { id: 'SP004', name: '韩国气垫BB霜', unit: '盒', supplierId: 'S001', supplierProductCode: 'KR-BB-001', supplyPrice: 85, img: '💄', status: 'active' },
        { id: 'SP005', name: '日本防晒霜60ml', unit: '瓶', supplierId: 'S002', supplierProductCode: 'JP-SUN-001', supplyPrice: 115, img: '☀️', status: 'active' },
        { id: 'SP006', name: '卫生巾A', unit: '包', supplierId: 'S001', supplierProductCode: 'KR-PAD-001', supplyPrice: 15, img: '📦', status: 'active' }
    ],
    
    // 运费模板列表（V2.0）
    freightTemplatesV2: JSON.parse(JSON.stringify(FREIGHT_TEMPLATES_V2)),
    
    // 不可发货地区模板列表
    noDeliveryTemplates: JSON.parse(JSON.stringify(NO_DELIVERY_TEMPLATES)),
    
    // 商城商品列表（面向消费者的SKU，可由多个原商品组成）
    products: [
        // 供应链商品 - 带原商品关联和运费模板
        { 
            id: 'P001', name: '韩国进口面膜套装', spec: '补水保湿/10片装', price: 99, supplyPrice: 70, img: '🧴', 
            type: 'supply', supplierId: 'S001', stock: 100, sales: 2341,
            freightTemplateId: 'FT001',      // 运费模板
            noDeliveryTemplateId: 'ND001',   // 不可发货地区模板
            sourceProducts: [{ sourceProductId: 'SP001', quantity: 10 }]
        },
        { 
            id: 'P002', name: '日本护肤精华液', spec: '美白淡斑/30ml', price: 159, supplyPrice: 110, img: '✨', 
            type: 'supply', supplierId: 'S002', stock: 50, sales: 1892,
            freightTemplateId: 'FT003',      // 基础运费模板（5元）
            noDeliveryTemplateId: 'ND001',
            sourceProducts: [{ sourceProductId: 'SP002', quantity: 1 }]
        },
        { 
            id: 'P003', name: '法国香水小样', spec: '花香调/5ml', price: 89, supplyPrice: 60, img: '🌸', 
            type: 'supply', supplierId: 'S003', stock: 30, sales: 3456,
            freightTemplateId: 'FT003',      // 基础运费模板（5元）
            noDeliveryTemplateId: 'ND002',   // 特殊商品不发货地区（含海南）
            sourceProducts: [{ sourceProductId: 'SP003', quantity: 1 }]
        },
        { 
            id: 'P004', name: '韩国气垫BB霜', spec: '自然色/15g', price: 128, supplyPrice: 85, img: '💄', 
            type: 'supply', supplierId: 'S001', stock: 80, sales: 1567,
            freightTemplateId: 'FT003',      // 基础运费模板（5元）
            noDeliveryTemplateId: 'ND001',
            sourceProducts: [{ sourceProductId: 'SP004', quantity: 1 }]
        },
        { 
            id: 'P005', name: '日本防晒霜', spec: 'SPF50/60ml', price: 168, supplyPrice: 115, img: '☀️', 
            type: 'supply', supplierId: 'S002', stock: 60, sales: 2103,
            freightTemplateId: 'FT001',
            noDeliveryTemplateId: 'ND001',
            sourceProducts: [{ sourceProductId: 'SP005', quantity: 1 }]
        },
        // 组合包装示例：卫生巾×2包
        { 
            id: 'P006', name: '卫生巾A×2包装', spec: '日用/2包', price: 35, supplyPrice: 30, img: '📦', 
            type: 'supply', supplierId: 'S001', stock: 50, sales: 890,
            freightTemplateId: 'FT001',
            noDeliveryTemplateId: 'ND001',
            sourceProducts: [{ sourceProductId: 'SP006', quantity: 2 }]
        },
        // 组合包装示例：卫生巾×3包
        { 
            id: 'P007', name: '卫生巾A×3包装', spec: '日用/3包', price: 50, supplyPrice: 45, img: '📦', 
            type: 'supply', supplierId: 'S001', stock: 40, sales: 650,
            freightTemplateId: 'FT001',
            noDeliveryTemplateId: 'ND001',
            sourceProducts: [{ sourceProductId: 'SP006', quantity: 3 }]
        },
        // 自营商品（无原商品关联，无运费模板）
        { id: 'P101', name: '自营品牌洗面奶', spec: '温和清洁/150ml', price: 68, img: '🧼', type: 'self', stock: 200, sales: 5678 },
        { id: 'P102', name: '自营品牌爽肤水', spec: '补水保湿/200ml', price: 88, img: '💧', type: 'self', stock: 150, sales: 4321 },
        { id: 'P103', name: '自营品牌面霜', spec: '滋润修护/50g', price: 128, img: '🫧', type: 'self', stock: 100, sales: 3210 }
    ],
    
    // 原商品ID计数器
    sourceProductIdCounter: 6,

    // 购物车
    cart: [],
    
    // 订单列表 (含运费字段: totalFreight)
    orders: [],
    
    // 子订单列表 (含运费字段: freight, freightSnapshot)
    subOrders: [],
    
    // 售后单列表
    afterSales: [],
    
    // 营业部配置
    departments: [
        { id: 'DEPT001', name: '99区营业部', region: '99区', lakalaMerchantNo: 'LKL99001', commissionRate: 0.05, status: 'active', createTime: '2026-01-01' },
        { id: 'DEPT002', name: '0区营业部', region: '0区', lakalaMerchantNo: 'LKL00001', commissionRate: 0.04, status: 'active', createTime: '2026-01-01' },
        { id: 'DEPT003', name: '1区营业部', region: '1区', lakalaMerchantNo: 'LKL01001', commissionRate: 0.045, status: 'active', createTime: '2026-01-01' },
        { id: 'DEPT004', name: '2区营业部', region: '2区', lakalaMerchantNo: 'LKL02001', commissionRate: 0.04, status: 'active', createTime: '2026-01-01' }
    ],
    
    // 平台配置
    platformConfig: {
        channelFeeRate: 0.0038,      // 渠道费率 0.38%
        opsServiceFeeRate: 0.10,     // 代运营服务费率 10%
        channelMerchantFeeRate: 0.05, // 渠道商分佣费率 5%
        settlementDelayDays: 7,       // 结算延迟天数
        minSettlementAmount: 100,     // 最低结算金额
        orderTimeoutMinutes: 30,      // 订单超时时间
        autoConfirmDays: 15,          // 自动确认收货天数
        // 运费相关配置
        freightEnabled: true,         // 是否启用运费功能
        defaultRemoteAreas: PLATFORM_REMOTE_AREAS,  // 平台默认偏远地区
        defaultNoDeliveryAreas: DEFAULT_NO_DELIVERY_AREAS  // 平台默认不发货地区
    },
    
    // 售后配置
    afterSaleConfig: JSON.parse(JSON.stringify(AFTERSALE_CONFIG)),
    
    // 订单ID计数器
    orderIdCounter: 1000,
    subOrderIdCounter: 1,
    afterSaleIdCounter: 1
};

// ==================== 资金清分计算函数 ====================

/**
 * 计算单个商品的清分数据
 * @param {number} itemAmount - 商品金额（售价 × 数量）
 * @param {number} cashPaid - 该商品分摊的现金支付金额
 * @param {boolean} hasDirectPromoter - 是否有直推
 * @param {boolean} hasIndirectPromoter - 是否有间推
 * @param {number} headquarterShareRate - 连锁总部占商家毛利的比例（V2.0新增，从品牌配置获取）
 * @returns {object} 清分结果
 */
function calculateItemClearing(itemAmount, cashPaid, hasDirectPromoter = true, hasIndirectPromoter = true, headquarterShareRate = 0) {
    const config = CLEARING_CONFIG;
    
    // 计算支付手续费（仅对现金部分）
    const paymentFee = Math.round(cashPaid * config.paymentFeeRate * 100) / 100;
    
    // 基础金额 = 商品金额 - 支付手续费
    const baseAmount = Math.round((itemAmount - paymentFee) * 100) / 100;
    
    // ========== 第一层：对商家分账（SPU级别配置）==========
    const platformAmount = Math.round(baseAmount * config.platformRate * 100) / 100;
    const operationAmount = Math.round(baseAmount * config.operationRate * 100) / 100;
    const merchantProfit = Math.round(baseAmount * config.merchantRate * 100) / 100;  // 商家毛利20%
    
    // 平台内部分配（做账用）
    const tradingCompanyAmount = Math.round(platformAmount * config.tradingCompanyRate * 100) / 100;
    const distributorAmount = Math.round(platformAmount * config.distributorRate * 100) / 100;
    
    // ========== 第二层：商家毛利的二次分配（品牌级别配置）==========
    // V2.0: 连锁总部从商家毛利中按品牌配置比例分配
    const headquarterAmount = Math.round(merchantProfit * headquarterShareRate * 100) / 100;
    const storeProfit = Math.round(merchantProfit * (1 - headquarterShareRate) * 100) / 100;  // 门店毛利
    
    // ========== 第三层：推广员佣金（从门店毛利扣，V2.0变更）==========
    // V2.0: 推广员佣金从门店毛利中扣除，不影响连锁总部
    const directCommission = hasDirectPromoter ? Math.round(storeProfit * config.directCommissionRate * 100) / 100 : 0;
    const indirectCommission = hasIndirectPromoter ? Math.round(storeProfit * config.indirectCommissionRate * 100) / 100 : 0;
    const storeNetProfit = Math.round((storeProfit - directCommission - indirectCommission) * 100) / 100;  // 门店净利润
    
    // 兼容旧字段：merchantNetProfit = storeNetProfit
    const merchantNetProfit = storeNetProfit;
    
    // 计算现金分配
    const merchantCashRetain = Math.round(cashPaid * config.merchantCashRetainRate * 100) / 100;
    let remainingCash = Math.round((cashPaid - paymentFee - merchantCashRetain) * 100) / 100;
    
    // 调试信息
    console.log(`清分计算调试 - 商品金额: ${itemAmount}, 现金支付: ${cashPaid}, 支付手续费: ${paymentFee}, 商家保留: ${merchantCashRetain}, 可分账现金: ${remainingCash}`);
    console.log(`需要分账 - 平台货款: ${platformAmount}, 代运营: ${operationAmount}, 连锁总部: ${headquarterAmount}, 直推: ${directCommission}, 间推: ${indirectCommission}`);
    
    // 按优先级分配现金：连锁总部 → 代运营 → 平台货款 → 直推 → 间推
    const clearingDetails = {
        headquarter: { amount: headquarterAmount, method: CLEARING_METHOD.DEPOSIT, splitAmount: 0, depositAmount: headquarterAmount },
        operation: { amount: operationAmount, method: CLEARING_METHOD.DEPOSIT, splitAmount: 0, depositAmount: operationAmount },
        platform: { amount: platformAmount, method: CLEARING_METHOD.DEPOSIT, splitAmount: 0, depositAmount: platformAmount },
        directPromoter: { amount: directCommission, method: CLEARING_METHOD.BALANCE, splitAmount: 0, balanceAmount: directCommission },
        indirectPromoter: { amount: indirectCommission, method: CLEARING_METHOD.BALANCE, splitAmount: 0, balanceAmount: indirectCommission }
    };
    
    // 1. 连锁总部（仅当有配置时）
    if (headquarterAmount > 0 && remainingCash >= headquarterAmount) {
        clearingDetails.headquarter.method = CLEARING_METHOD.SPLIT_ACCOUNT;
        clearingDetails.headquarter.splitAmount = headquarterAmount;
        clearingDetails.headquarter.depositAmount = 0;
        remainingCash = Math.round((remainingCash - headquarterAmount) * 100) / 100;
    }
    
    // 2. 代运营
    if (remainingCash >= operationAmount) {
        clearingDetails.operation.method = CLEARING_METHOD.SPLIT_ACCOUNT;
        clearingDetails.operation.splitAmount = operationAmount;
        clearingDetails.operation.depositAmount = 0;
        remainingCash = Math.round((remainingCash - operationAmount) * 100) / 100;
    }
    
    // 3. 平台货款
    if (remainingCash >= platformAmount) {
        clearingDetails.platform.method = CLEARING_METHOD.SPLIT_ACCOUNT;
        clearingDetails.platform.splitAmount = platformAmount;
        clearingDetails.platform.depositAmount = 0;
        remainingCash = Math.round((remainingCash - platformAmount) * 100) / 100;
    }
    
    // 4. 直推佣金
    if (hasDirectPromoter && remainingCash >= directCommission) {
        clearingDetails.directPromoter.method = CLEARING_METHOD.SPLIT_ACCOUNT;
        clearingDetails.directPromoter.splitAmount = directCommission;
        clearingDetails.directPromoter.balanceAmount = 0;
        remainingCash = Math.round((remainingCash - directCommission) * 100) / 100;
    }
    
    // 5. 间推佣金
    if (hasIndirectPromoter && remainingCash >= indirectCommission) {
        clearingDetails.indirectPromoter.method = CLEARING_METHOD.SPLIT_ACCOUNT;
        clearingDetails.indirectPromoter.splitAmount = indirectCommission;
        clearingDetails.indirectPromoter.balanceAmount = 0;
        remainingCash = Math.round((remainingCash - indirectCommission) * 100) / 100;
    }
    
    // 计算保证金扣除总额
    const totalDepositDeduct = Math.round((
        clearingDetails.headquarter.depositAmount +
        clearingDetails.operation.depositAmount +
        clearingDetails.platform.depositAmount
    ) * 100) / 100;
    
    // 计算空中分账总额
    const totalSplitAmount = Math.round((
        clearingDetails.headquarter.splitAmount +
        clearingDetails.operation.splitAmount +
        clearingDetails.platform.splitAmount +
        clearingDetails.directPromoter.splitAmount +
        clearingDetails.indirectPromoter.splitAmount
    ) * 100) / 100;
    
    return {
        // 基础信息
        itemAmount,
        cashPaid,
        paymentFee,
        baseAmount,
        
        // 第一层：各方应得
        platformAmount,           // 平台货款（贸易公司代收）70%
        tradingCompanyAmount,     // 贸易公司实得（做账）
        distributorAmount,        // 经销商应得（做账，线下结算）
        operationAmount,          // 代运营 10%
        merchantProfit,           // 商家毛利 20%
        
        // 第二层：商家毛利分配（V2.0新增）
        headquarterAmount,        // 连锁总部（从商家毛利中按品牌配置比例）
        headquarterShareRate,     // 连锁总部分成比例
        storeProfit,              // 门店毛利（商家毛利 - 连锁总部）
        
        // 第三层：推广员佣金（从门店毛利扣）
        directCommission,         // 直推佣金
        indirectCommission,       // 间推佣金
        storeNetProfit,           // 门店净利润（门店毛利 - 推广员佣金）
        merchantNetProfit,        // 兼容旧字段，等于门店净利润
        
        // 商家现金
        merchantCashRetain,       // 商家保留现金
        merchantActualCash: Math.round((merchantCashRetain + remainingCash) * 100) / 100,  // 商家实收现金
        
        // 清分明细
        clearingDetails,
        
        // 汇总
        totalDepositDeduct,       // 保证金扣除总额
        totalSplitAmount,         // 空中分账总额
        totalPromoterBalance: Math.round((
            clearingDetails.directPromoter.balanceAmount +
            clearingDetails.indirectPromoter.balanceAmount
        ) * 100) / 100,           // 推广员余额账户总额
        
        // 版本标记
        clearingVersion: '2.0'
    };
}

/**
 * 计算子订单的清分数据（子订单级别汇总）
 * @param {object} subOrder - 子订单对象
 * @param {string} storeId - 门店ID（用于获取品牌配置）
 * @returns {object} 清分结果
 */
function calculateSubOrderClearing(subOrder, storeId = null) {
    const itemAmount = subOrder.amount || 0;
    const cashPaid = subOrder.cashPaid || 0;
    
    // 模拟推广员（实际应从订单关联的推广员数据获取）
    const hasDirectPromoter = true;
    const hasIndirectPromoter = true;
    
    // V2.0: 获取门店的连锁总部分成比例
    let headquarterShareRate = 0;
    if (storeId) {
        const store = TEST_STORES[storeId] || DB.stores[storeId];
        if (store && store.headquarterShareRate !== undefined) {
            headquarterShareRate = store.headquarterShareRate;
        } else if (store && store.brandName) {
            // 从品牌配置获取
            const brandConfig = BRAND_CONFIG[store.brandName] || BRAND_CONFIG['_default'];
            headquarterShareRate = brandConfig.headquarterShareRate || 0;
        }
    }
    
    return calculateItemClearing(itemAmount, cashPaid, hasDirectPromoter, hasIndirectPromoter, headquarterShareRate);
}

/**
 * 计算单个 SKU 商品的清分数据
 * @param {object} item - SKU 商品项 { productId, name, price, qty, ... }
 * @param {number} skuCashPaid - 该 SKU 分摊的现金支付金额
 * @param {string} storeId - 门店ID（用于获取品牌配置）
 * @param {boolean} hasDirectPromoter - 是否有直推
 * @param {boolean} hasIndirectPromoter - 是否有间推
 * @returns {object} SKU 级别的清分数据
 */
function calculateSkuClearing(item, skuCashPaid, skuMemberDiscount = 0, storeId = null, hasDirectPromoter = true, hasIndirectPromoter = true) {
    const skuOriginalAmount = item.price * item.qty;  // 原价
    const skuPayableAmount = skuOriginalAmount - skuMemberDiscount;  // 应付金额（扣除会员优惠）
    
    // V2.0: 获取门店的连锁总部分成比例
    let headquarterShareRate = 0;
    if (storeId) {
        const store = TEST_STORES[storeId] || DB.stores[storeId];
        if (store && store.headquarterShareRate !== undefined) {
            headquarterShareRate = store.headquarterShareRate;
        } else if (store && store.brandName) {
            const brandConfig = BRAND_CONFIG[store.brandName] || BRAND_CONFIG['_default'];
            headquarterShareRate = brandConfig.headquarterShareRate || 0;
        }
    }
    
    // 使用应付金额进行清分计算
    return calculateItemClearing(skuPayableAmount, skuCashPaid, hasDirectPromoter, hasIndirectPromoter, headquarterShareRate);
}

/**
 * 为子订单生成 SKU 级别的清分数据并保存
 * @param {object} subOrder - 子订单对象
 * @param {string} storeId - 门店ID（用于获取品牌配置）
 */
function generateSubOrderClearingData(subOrder, storeId = null) {
    if (!subOrder.items || subOrder.items.length === 0) {
        return null;
    }
    
    // 计算子订单商品总金额（用于分摊现金支付）
    const subOrderTotal = subOrder.items.reduce((sum, item) => sum + item.price * item.qty, 0);
    const totalCashPaid = subOrder.cashPaid || 0;
    
    // 模拟推广员（实际应从订单关联的推广员数据获取）
    const hasDirectPromoter = true;
    const hasIndirectPromoter = true;
    
    // 为每个 SKU 计算清分数据
    const skuClearings = [];
    subOrder.items.forEach((item, index) => {
        const skuAmount = item.price * item.qty;
        const skuRatio = subOrderTotal > 0 ? skuAmount / subOrderTotal : 0;
        const skuCashPaid = Math.round(totalCashPaid * skuRatio * 100) / 100;
        
        // 计算该 SKU 的清分数据
        const clearing = calculateSkuClearing(item, skuCashPaid, 0, storeId, hasDirectPromoter, hasIndirectPromoter);
        
        // 保存清分数据到 SKU 商品项
        item.clearing = {
            // 基础信息
            skuAmount: clearing.itemAmount,
            cashPaid: clearing.cashPaid,
            paymentFee: clearing.paymentFee,
            baseAmount: clearing.baseAmount,
            
            // 第一层：各方应得
            platformAmount: clearing.platformAmount,
            tradingCompanyAmount: clearing.tradingCompanyAmount,
            distributorAmount: clearing.distributorAmount,
            operationAmount: clearing.operationAmount,
            merchantProfit: clearing.merchantProfit,
            
            // 第二层：商家毛利分配（V2.0新增）
            headquarterAmount: clearing.headquarterAmount,
            headquarterShareRate: clearing.headquarterShareRate,
            storeProfit: clearing.storeProfit,
            
            // 第三层：推广员佣金
            directCommission: clearing.directCommission,
            indirectCommission: clearing.indirectCommission,
            storeNetProfit: clearing.storeNetProfit,
            merchantNetProfit: clearing.merchantNetProfit,
            
            // 商家现金
            merchantCashRetain: clearing.merchantCashRetain,
            merchantActualCash: clearing.merchantActualCash,
            
            // 清分明细（记录每方的结算方式）
            details: {
                headquarter: clearing.clearingDetails.headquarter,
                operation: clearing.clearingDetails.operation,
                platform: clearing.clearingDetails.platform,
                directPromoter: clearing.clearingDetails.directPromoter,
                indirectPromoter: clearing.clearingDetails.indirectPromoter
            },
            
            // 汇总
            totalDepositDeduct: clearing.totalDepositDeduct,
            totalSplitAmount: clearing.totalSplitAmount,
            totalPromoterBalance: clearing.totalPromoterBalance,
            
            // 状态
            status: 'frozen',  // frozen=冻结, settled=已结算
            clearingVersion: '2.0',
            createTime: new Date().toISOString()
        };
        
        skuClearings.push(clearing);
    });
    
    // 汇总子订单级别的清分数据（用于兼容旧代码和统计）
    const subOrderClearing = {
        // 基础信息
        itemAmount: subOrderTotal,
        cashPaid: totalCashPaid,
        paymentFee: skuClearings.reduce((sum, c) => sum + c.paymentFee, 0),
        baseAmount: skuClearings.reduce((sum, c) => sum + c.baseAmount, 0),
        
        // 第一层：各方应得（汇总）
        platformAmount: skuClearings.reduce((sum, c) => sum + c.platformAmount, 0),
        tradingCompanyAmount: skuClearings.reduce((sum, c) => sum + c.tradingCompanyAmount, 0),
        distributorAmount: skuClearings.reduce((sum, c) => sum + c.distributorAmount, 0),
        operationAmount: skuClearings.reduce((sum, c) => sum + c.operationAmount, 0),
        merchantProfit: skuClearings.reduce((sum, c) => sum + c.merchantProfit, 0),
        
        // 第二层：商家毛利分配（V2.0新增）
        headquarterAmount: skuClearings.reduce((sum, c) => sum + c.headquarterAmount, 0),
        headquarterShareRate: skuClearings[0]?.headquarterShareRate || 0,
        storeProfit: skuClearings.reduce((sum, c) => sum + c.storeProfit, 0),
        
        // 第三层：推广员佣金
        directCommission: skuClearings.reduce((sum, c) => sum + c.directCommission, 0),
        indirectCommission: skuClearings.reduce((sum, c) => sum + c.indirectCommission, 0),
        storeNetProfit: skuClearings.reduce((sum, c) => sum + c.storeNetProfit, 0),
        merchantNetProfit: skuClearings.reduce((sum, c) => sum + c.merchantNetProfit, 0),
        
        // 商家现金
        merchantCashRetain: skuClearings.reduce((sum, c) => sum + c.merchantCashRetain, 0),
        merchantActualCash: skuClearings.reduce((sum, c) => sum + c.merchantActualCash, 0),
        
        // 汇总
        totalDepositDeduct: skuClearings.reduce((sum, c) => sum + c.totalDepositDeduct, 0),
        totalSplitAmount: skuClearings.reduce((sum, c) => sum + c.totalSplitAmount, 0),
        totalPromoterBalance: skuClearings.reduce((sum, c) => sum + c.totalPromoterBalance, 0),
        
        // 状态
        status: 'frozen',
        clearingVersion: '2.0',
        createTime: new Date().toISOString(),
        
        // SKU 数量
        skuCount: subOrder.items.length
    };
    
    // 四舍五入处理
    Object.keys(subOrderClearing).forEach(key => {
        if (typeof subOrderClearing[key] === 'number' && key !== 'skuCount') {
            subOrderClearing[key] = Math.round(subOrderClearing[key] * 100) / 100;
        }
    });
    
    // 保存子订单级别汇总（兼容旧代码）
    subOrder.clearing = subOrderClearing;
    
    return subOrderClearing;
}

// 生成订单号
function generateOrderId() {
    const date = new Date();
    const dateStr = date.getFullYear().toString() + 
        (date.getMonth() + 1).toString().padStart(2, '0') + 
        date.getDate().toString().padStart(2, '0');
    DB.orderIdCounter++;
    return dateStr + DB.orderIdCounter.toString().padStart(8, '0');
}

// 生成子订单号
function generateSubOrderId(parentOrderId) {
    DB.subOrderIdCounter++;
    return parentOrderId + '-' + DB.subOrderIdCounter.toString().padStart(3, '0');
}

// 生成售后单号
function generateAfterSaleId() {
    const date = new Date();
    const dateStr = date.getFullYear().toString() + 
        (date.getMonth() + 1).toString().padStart(2, '0') + 
        date.getDate().toString().padStart(2, '0');
    DB.afterSaleIdCounter++;
    return 'AS' + dateStr + DB.afterSaleIdCounter.toString().padStart(5, '0');
}

// 添加到购物车
function addToCart(productId, qty = 1) {
    const product = DB.products.find(p => p.id === productId);
    if (!product) return false;
    
    const existingItem = DB.cart.find(item => item.productId === productId);
    if (existingItem) {
        existingItem.qty = Math.min(existingItem.qty + qty, product.stock);
    } else {
        DB.cart.push({
            productId: productId,
            qty: qty,
            selected: true
        });
    }
    saveData();
    return true;
}

// 更新购物车数量
function updateCartQty(productId, qty) {
    const item = DB.cart.find(i => i.productId === productId);
    const product = DB.products.find(p => p.id === productId);
    if (item && product) {
        item.qty = Math.max(1, Math.min(qty, product.stock));
        saveData();
    }
}

// 切换购物车选中状态
function toggleCartSelect(productId) {
    const item = DB.cart.find(i => i.productId === productId);
    if (item) {
        item.selected = !item.selected;
        saveData();
    }
}

// 从购物车移除
function removeFromCart(productId) {
    DB.cart = DB.cart.filter(item => item.productId !== productId);
    saveData();
}

// 获取购物车商品详情
function getCartItems() {
    return DB.cart.map(item => {
        const product = DB.products.find(p => p.id === item.productId);
        return { ...item, product };
    });
}

// 将商城商品拆解为原商品（用于传递给供应链发货）
// 输入: [{productId, qty, ...}] 商城商品列表
// 输出: [{sourceProductId, sourceProductName, unit, quantity, supplierProductCode}] 原商品列表
function expandToSourceProducts(orderItems) {
    const sourceProductMap = {};
    
    orderItems.forEach(item => {
        const product = DB.products.find(p => p.id === item.productId);
        if (!product || !product.sourceProducts) return;
        
        product.sourceProducts.forEach(sp => {
            const sourceProduct = DB.sourceProducts.find(s => s.id === sp.sourceProductId);
            if (!sourceProduct) return;
            
            const key = sp.sourceProductId;
            const expandedQty = sp.quantity * item.qty;
            
            if (sourceProductMap[key]) {
                sourceProductMap[key].quantity += expandedQty;
            } else {
                sourceProductMap[key] = {
                    sourceProductId: sourceProduct.id,
                    sourceProductName: sourceProduct.name,
                    unit: sourceProduct.unit,
                    quantity: expandedQty,
                    supplierProductCode: sourceProduct.supplierProductCode,
                    supplierId: sourceProduct.supplierId,
                    supplyPrice: sourceProduct.supplyPrice,
                    img: sourceProduct.img
                };
            }
        });
    });
    
    return Object.values(sourceProductMap);
}

// 获取订单的供应链发货商品明细
function getSupplyChainItems(subOrder) {
    if (!subOrder || !subOrder.items) return [];
    return expandToSourceProducts(subOrder.items);
}

// 计算最优支付方案
function calculateOptimalPayment(totalAmount) {
    const user = DB.user;
    const maxPointsDeduct = Math.min(user.points / 100, totalAmount); // 积分可抵扣金额
    const afterPointsAmount = totalAmount - maxPointsDeduct;
    
    // 方案1: 全积分 (如果积分足够)
    if (user.points / 100 >= totalAmount) {
        return {
            type: 'points_only',
            label: '全积分支付',
            pointsUsed: totalAmount * 100,
            pointsDeduct: totalAmount,
            cardUsed: 0,
            cashAmount: 0
        };
    }
    
    // 方案2: 全卡金 (如果卡金足够)
    if (user.cardBalance >= totalAmount) {
        return {
            type: 'card_only',
            label: '全卡金支付',
            pointsUsed: 0,
            pointsDeduct: 0,
            cardUsed: totalAmount,
            cashAmount: 0
        };
    }
    
    // 方案3: 积分+卡金 (如果卡金能覆盖积分抵扣后的剩余)
    if (user.cardBalance >= afterPointsAmount && maxPointsDeduct > 0) {
        return {
            type: 'points_card',
            label: '积分+卡金',
            pointsUsed: maxPointsDeduct * 100,
            pointsDeduct: maxPointsDeduct,
            cardUsed: afterPointsAmount,
            cashAmount: 0
        };
    }
    
    // 方案4: 积分+现金
    if (maxPointsDeduct > 0) {
        return {
            type: 'points_cash',
            label: '积分+现金',
            pointsUsed: maxPointsDeduct * 100,
            pointsDeduct: maxPointsDeduct,
            cardUsed: 0,
            cashAmount: afterPointsAmount
        };
    }
    
    // 方案5: 全现金
    return {
        type: 'cash_only',
        label: '全现金支付',
        pointsUsed: 0,
        pointsDeduct: 0,
        cardUsed: 0,
        cashAmount: totalAmount
    };
}

// 获取所有可用支付方案
function getAvailablePaymentPlans(totalAmount) {
    const user = DB.user;
    const plans = [];
    const maxPointsDeduct = Math.min(user.points / 100, totalAmount);
    const afterPointsAmount = totalAmount - maxPointsDeduct;
    
    // 全现金
    plans.push({
        type: 'cash_only',
        label: '全现金支付',
        pointsUsed: 0,
        pointsDeduct: 0,
        cardUsed: 0,
        cashAmount: totalAmount,
        available: true
    });
    
    // 全积分
    plans.push({
        type: 'points_only',
        label: '全积分支付',
        pointsUsed: totalAmount * 100,
        pointsDeduct: totalAmount,
        cardUsed: 0,
        cashAmount: 0,
        available: user.points / 100 >= totalAmount
    });
    
    // 全卡金
    plans.push({
        type: 'card_only',
        label: '全卡金支付',
        pointsUsed: 0,
        pointsDeduct: 0,
        cardUsed: totalAmount,
        cashAmount: 0,
        available: user.cardBalance >= totalAmount
    });
    
    // 积分+卡金
    if (maxPointsDeduct > 0 && maxPointsDeduct < totalAmount) {
        plans.push({
            type: 'points_card',
            label: '积分+卡金',
            pointsUsed: maxPointsDeduct * 100,
            pointsDeduct: maxPointsDeduct,
            cardUsed: afterPointsAmount,
            cashAmount: 0,
            available: user.cardBalance >= afterPointsAmount
        });
    }
    
    // 积分+现金
    if (maxPointsDeduct > 0 && maxPointsDeduct < totalAmount) {
        plans.push({
            type: 'points_cash',
            label: '积分+现金',
            pointsUsed: maxPointsDeduct * 100,
            pointsDeduct: maxPointsDeduct,
            cardUsed: 0,
            cashAmount: afterPointsAmount,
            available: true
        });
    }
    
    return plans;
}

// 创建订单 (含自动拆单逻辑)
// isPaid: true=已支付(立即拆单), false=待支付(暂不拆单)
function createOrder(addressId, paymentPlan, cartType, isPaid = true) {
    const address = DB.user.addresses.find(a => a.id === addressId);
    if (!address) return { success: false, error: '请选择收货地址' };
    
    // 获取选中的购物车商品
    const selectedItems = getCartItems().filter(item => 
        item.selected && item.product && item.product.type === cartType
    );
    
    if (selectedItems.length === 0) {
        return { success: false, error: '请选择商品' };
    }
    
    // 计算订单总金额
    const totalAmount = selectedItems.reduce((sum, item) => sum + item.product.price * item.qty, 0);
    
    // 获取运费信息（从paymentPlan中获取）
    const freightResult = paymentPlan.freightResult || { totalFreight: 0, supplierFreights: [] };
    const totalFreight = freightResult.totalFreight || 0;
    
    // 生成主订单
    const orderId = generateOrderId();
    const now = new Date();
    
    const order = {
        id: orderId,
        userId: DB.user.id,
        storeId: DB.user.storeId || currentStoreId,  // 记录订单所属门店
        storeName: DB.currentStore ? DB.currentStore.name : '',  // 门店名称
        merchantId: 'M001',
        type: cartType, // 'supply' 或 'self'
        status: isPaid ? 'paid' : 'pending_pay', // pending_pay, paid, partial_shipped, shipped, completed, cancelled
        totalAmount: totalAmount,
        totalFreight: totalFreight,  // 保存总运费
        pointsDeduct: isPaid ? paymentPlan.pointsDeduct : 0,
        cardDeduct: isPaid ? paymentPlan.cardUsed : 0,
        cashPaid: paymentPlan.cashAmount,
        couponDeduct: paymentPlan.couponDeduct || 0,
        paymentType: paymentPlan.type,
        paymentLabel: paymentPlan.label,
        // 保存完整的支付方案，用于订单详情显示
        paymentPlan: {
            cashPayMethod: paymentPlan.cashPayMethod || 'wechat',
            cardUsed: isPaid ? (paymentPlan.cardUsed || 0) : 0,
            cashAmount: paymentPlan.cashAmount || 0,
            pointsDeduct: isPaid ? (paymentPlan.pointsDeduct || 0) : 0,
            pointsUsed: isPaid ? (paymentPlan.pointsUsed || 0) : 0
        },
        address: { ...address },
        items: selectedItems.map(item => ({
            productId: item.productId,
            name: item.product.name,
            spec: item.product.spec,
            price: item.product.price,
            qty: item.qty,
            img: item.product.img,
            supplierId: item.product.supplierId || null,
            supplyPrice: item.product.supplyPrice || null
        })),
        subOrderIds: [],
        freightResult: freightResult, // 保存运费计算结果，用于后续拆单
        createTime: now.toISOString(),
        payTime: isPaid ? now.toISOString() : null,
        updateTime: now.toISOString()
    };
    
    // 只有已支付的订单才立即拆单
    if (isPaid) {
        // 自动拆单逻辑 (按供应商拆分)
        if (cartType === 'supply') {
            const supplierGroups = {};
            selectedItems.forEach(item => {
                const supplierId = item.product.supplierId;
                if (!supplierGroups[supplierId]) {
                    supplierGroups[supplierId] = [];
                }
                supplierGroups[supplierId].push(item);
            });
            
            // 计算总商品金额（不含运费），用于分摊支付金额
            const totalProductAmount = selectedItems.reduce((sum, item) => sum + item.product.price * item.qty, 0);
            
            // 为每个供应商创建子订单
            const supplierIds = Object.keys(supplierGroups);
            supplierIds.forEach((supplierId, index) => {
                const items = supplierGroups[supplierId];
                const supplier = DB.suppliers.find(s => s.id === supplierId);
                const subOrderId = generateSubOrderId(orderId);
                
                const subAmount = items.reduce((sum, item) => sum + item.product.price * item.qty, 0);
                const supplyAmount = items.reduce((sum, item) => sum + item.product.supplyPrice * item.qty, 0);
                
                // 获取该供应商的运费信息
                const supplierFreightInfo = freightResult.supplierFreights.find(sf => sf.supplierId === supplierId);
                const subFreight = supplierFreightInfo ? supplierFreightInfo.freight : 0;
                
                // 按子订单金额占比分摊支付金额
                const ratio = totalProductAmount > 0 ? subAmount / totalProductAmount : (1 / supplierIds.length);
                const isLast = index === supplierIds.length - 1;
                
                // 计算分摊的支付金额（最后一个子订单用减法确保总和正确）
                let subPointsDeduct, subCardDeduct, subCashPaid, subCouponDeduct;
                if (isLast) {
                    // 最后一个子订单：用总额减去前面的，避免精度问题
                    const prevSubOrders = DB.subOrders.filter(so => so.parentOrderId === orderId);
                    const usedPoints = prevSubOrders.reduce((sum, so) => sum + (so.pointsDeduct || 0), 0);
                    const usedCard = prevSubOrders.reduce((sum, so) => sum + (so.cardDeduct || 0), 0);
                    const usedCash = prevSubOrders.reduce((sum, so) => sum + (so.cashPaid || 0), 0);
                    const usedCoupon = prevSubOrders.reduce((sum, so) => sum + (so.couponDeduct || 0), 0);
                    subPointsDeduct = (paymentPlan.pointsDeduct || 0) - usedPoints;
                    subCardDeduct = (paymentPlan.cardUsed || 0) - usedCard;
                    subCashPaid = (paymentPlan.cashAmount || 0) - usedCash;
                    subCouponDeduct = (paymentPlan.couponDeduct || 0) - usedCoupon;
                } else {
                    subPointsDeduct = Math.round((paymentPlan.pointsDeduct || 0) * ratio * 100) / 100;
                    subCardDeduct = Math.round((paymentPlan.cardUsed || 0) * ratio * 100) / 100;
                    subCashPaid = Math.round((paymentPlan.cashAmount || 0) * ratio * 100) / 100;
                    subCouponDeduct = Math.round((paymentPlan.couponDeduct || 0) * ratio * 100) / 100;
                }
                
                // 生成运费快照（锁定运费信息，后续规则变更不影响已生成订单）
                const freightSnapshot = createFreightSnapshot(
                    subOrderId,
                    supplierId,
                    address.province,
                    subAmount,
                    subFreight
                );
                
                const subOrder = {
                    id: subOrderId,
                    parentOrderId: orderId,
                    supplierId: supplierId,
                    supplierName: supplier ? supplier.name : '未知供应商',
                    status: 'pending_ship', // pending_ship, partial_shipped, shipped, delivered
                    items: items.map(item => ({
                        productId: item.productId,
                        name: item.product.name,
                        spec: item.product.spec,
                        price: item.product.price,
                        supplyPrice: item.product.supplyPrice,
                        qty: item.qty,
                        img: item.product.img
                    })),
                    amount: subAmount,
                    supplyAmount: supplyAmount,
                    freight: subFreight,  // 保存子订单运费
                    freightSnapshot: freightSnapshot,  // 保存运费快照（包含模板版本等信息）
                    // 分摊的支付金额（用于退款）
                    pointsDeduct: subPointsDeduct,
                    cardDeduct: subCardDeduct,
                    cashPaid: subCashPaid,
                    couponDeduct: subCouponDeduct,
                    // 多包裹支持
                    packages: [],  // 包裹列表: [{id, expressCompany, trackingNo, items: [{productId, qty}], shipTime, status}]
                    expressCompany: '',  // 兼容旧数据
                    trackingNo: '',      // 兼容旧数据
                    createTime: now.toISOString(),
                    shipTime: null,
                    deliverTime: null
                };
                
                // 生成清分数据（V2.0: 传入storeId用于获取品牌配置）
                generateSubOrderClearingData(subOrder, order.storeId);
                
                DB.subOrders.push(subOrder);
                order.subOrderIds.push(subOrderId);
            });
        } else {
            // 自营商品只创建一个子订单
            const subOrderId = generateSubOrderId(orderId);
            const subOrder = {
                id: subOrderId,
                parentOrderId: orderId,
                supplierId: null,
                supplierName: '自营仓库',
                status: 'pending_ship',
                items: order.items,
                amount: totalAmount,
                supplyAmount: 0,
                freight: 0,  // 自营商品免运费
                // 自营只有一个子订单，支付金额全部归它
                pointsDeduct: paymentPlan.pointsDeduct || 0,
                cardDeduct: paymentPlan.cardUsed || 0,
                cashPaid: paymentPlan.cashAmount || 0,
                couponDeduct: paymentPlan.couponDeduct || 0,
                // 多包裹支持
                packages: [],
                expressCompany: '',
                trackingNo: '',
                createTime: now.toISOString(),
                shipTime: null,
                deliverTime: null
            };
            
            // 生成清分数据（V2.0: 传入storeId用于获取品牌配置）
            generateSubOrderClearingData(subOrder, order.storeId);
            
            DB.subOrders.push(subOrder);
            order.subOrderIds.push(subOrderId);
        }
        
        // 已支付订单：扣除用户积分和卡金
        DB.user.points -= paymentPlan.pointsUsed;
        DB.user.cardBalance -= paymentPlan.cardUsed;
    }
    
    // 扣减库存（无论是否支付都要扣减，防止超卖）
    selectedItems.forEach(item => {
        const product = DB.products.find(p => p.id === item.productId);
        if (product) {
            product.stock -= item.qty;
            product.sales += item.qty;
        }
    });
    
    // 从购物车移除已购买商品
    selectedItems.forEach(item => {
        removeFromCart(item.productId);
    });
    
    DB.orders.push(order);
    saveData();
    
    return { success: true, orderId: orderId, order: order };
}

// 发货 (平台后台操作) - 支持多包裹拆单发货
// packageItems: [{productId, qty}] 本次发货的商品，如果为空则发全部未发货商品
function shipSubOrder(subOrderId, expressCompany, trackingNo, packageItems = null) {
    const subOrder = DB.subOrders.find(so => so.id === subOrderId);
    if (!subOrder) return { success: false, error: '子订单不存在' };
    
    // 初始化packages数组（兼容旧数据）
    if (!subOrder.packages) {
        subOrder.packages = [];
    }
    
    const now = new Date().toISOString();
    
    // 计算已发货的商品数量
    const shippedQty = {};
    subOrder.packages.forEach(pkg => {
        (pkg.items || []).forEach(item => {
            shippedQty[item.productId] = (shippedQty[item.productId] || 0) + item.qty;
        });
    });
    
    // 确定本次发货的商品
    let itemsToShip = [];
    if (packageItems && packageItems.length > 0) {
        // 指定了发货商品
        itemsToShip = packageItems.map(pi => {
            const orderItem = subOrder.items.find(i => i.productId === pi.productId);
            const alreadyShipped = shippedQty[pi.productId] || 0;
            const remaining = (orderItem ? orderItem.qty : 0) - alreadyShipped;
            return {
                productId: pi.productId,
                qty: Math.min(pi.qty, remaining),
                name: orderItem ? orderItem.name : '',
                spec: orderItem ? orderItem.spec : '',
                img: orderItem ? orderItem.img : ''
            };
        }).filter(i => i.qty > 0);
    } else {
        // 发全部未发货商品
        itemsToShip = subOrder.items.map(item => {
            const alreadyShipped = shippedQty[item.productId] || 0;
            const remaining = item.qty - alreadyShipped;
            return {
                productId: item.productId,
                qty: remaining,
                name: item.name,
                spec: item.spec,
                img: item.img
            };
        }).filter(i => i.qty > 0);
    }
    
    if (itemsToShip.length === 0) {
        return { success: false, error: '没有可发货的商品' };
    }
    
    // 将商城商品拆解为基础商品（供应链发货商品）
    const sourceItems = expandToSourceProducts(itemsToShip);
    
    // 创建新包裹
    const packageId = `${subOrderId}-PKG${(subOrder.packages.length + 1).toString().padStart(2, '0')}`;
    const newPackage = {
        id: packageId,
        expressCompany: expressCompany,
        trackingNo: trackingNo,
        items: itemsToShip,           // 商城商品（面向消费者）
        sourceItems: sourceItems,      // 基础商品（供应链发货用）
        shipTime: now,
        status: 'shipped'  // shipped, delivered
    };
    
    subOrder.packages.push(newPackage);
    
    // 兼容旧字段（记录最后一次发货信息）
    subOrder.expressCompany = expressCompany;
    subOrder.trackingNo = trackingNo;
    if (!subOrder.shipTime) {
        subOrder.shipTime = now;
    }
    
    // 更新子订单状态
    updateSubOrderShipStatus(subOrder);
    
    // 更新主订单状态
    updateParentOrderStatus(subOrder.parentOrderId);
    saveData();
    
    return { success: true, packageId: packageId, package: newPackage };
}

// 更新子订单发货状态
function updateSubOrderShipStatus(subOrder) {
    if (!subOrder.packages || subOrder.packages.length === 0) {
        subOrder.status = 'pending_ship';
        return;
    }
    
    // 计算已发货数量
    const shippedQty = {};
    const deliveredQty = {};
    subOrder.packages.forEach(pkg => {
        (pkg.items || []).forEach(item => {
            shippedQty[item.productId] = (shippedQty[item.productId] || 0) + item.qty;
            if (pkg.status === 'delivered') {
                deliveredQty[item.productId] = (deliveredQty[item.productId] || 0) + item.qty;
            }
        });
    });
    
    // 检查是否全部发货
    const allShipped = subOrder.items.every(item => 
        (shippedQty[item.productId] || 0) >= item.qty
    );
    
    // 检查是否全部签收
    const allDelivered = subOrder.items.every(item => 
        (deliveredQty[item.productId] || 0) >= item.qty
    );
    
    if (allDelivered) {
        subOrder.status = 'delivered';
        if (!subOrder.deliverTime) {
            subOrder.deliverTime = new Date().toISOString();
        }
    } else if (allShipped) {
        subOrder.status = 'shipped';
    } else if (subOrder.packages.length > 0) {
        subOrder.status = 'partial_shipped';
    } else {
        subOrder.status = 'pending_ship';
    }
}

// 获取子订单未发货商品
function getUnshippedItems(subOrderId) {
    const subOrder = DB.subOrders.find(so => so.id === subOrderId);
    if (!subOrder) return [];
    
    // 计算已发货数量
    const shippedQty = {};
    (subOrder.packages || []).forEach(pkg => {
        (pkg.items || []).forEach(item => {
            shippedQty[item.productId] = (shippedQty[item.productId] || 0) + item.qty;
        });
    });
    
    // 返回未发货商品
    return subOrder.items.map(item => ({
        ...item,
        shippedQty: shippedQty[item.productId] || 0,
        remainingQty: item.qty - (shippedQty[item.productId] || 0)
    })).filter(item => item.remainingQty > 0);
}

// 确认收货 - 支持按包裹确认或整单确认
// packageId: 如果指定则只确认该包裹，否则确认所有包裹
function confirmReceive(subOrderId, packageId = null) {
    const subOrder = DB.subOrders.find(so => so.id === subOrderId);
    if (!subOrder) return { success: false, error: '子订单不存在' };
    
    const now = new Date().toISOString();
    
    // 初始化packages（兼容旧数据）
    if (!subOrder.packages) {
        subOrder.packages = [];
    }
    
    // 如果有旧数据但没有packages，创建一个兼容包裹
    if (subOrder.packages.length === 0 && subOrder.trackingNo) {
        subOrder.packages.push({
            id: `${subOrderId}-PKG01`,
            expressCompany: subOrder.expressCompany,
            trackingNo: subOrder.trackingNo,
            items: subOrder.items.map(i => ({ productId: i.productId, qty: i.qty, name: i.name, spec: i.spec, img: i.img })),
            shipTime: subOrder.shipTime,
            status: 'shipped'
        });
    }
    
    if (packageId) {
        // 确认指定包裹
        const pkg = subOrder.packages.find(p => p.id === packageId);
        if (!pkg) return { success: false, error: '包裹不存在' };
        pkg.status = 'delivered';
        pkg.deliverTime = now;
    } else {
        // 确认所有包裹
        subOrder.packages.forEach(pkg => {
            if (pkg.status === 'shipped') {
                pkg.status = 'delivered';
                pkg.deliverTime = now;
            }
        });
    }
    
    // 更新子订单状态
    updateSubOrderShipStatus(subOrder);
    
    // 更新主订单状态
    updateParentOrderStatus(subOrder.parentOrderId);
    saveData();
    
    return { success: true };
}

// 更新主订单状态
function updateParentOrderStatus(orderId) {
    const order = DB.orders.find(o => o.id === orderId);
    if (!order) return;
    
    const subOrders = DB.subOrders.filter(so => so.parentOrderId === orderId);
    
    const allDelivered = subOrders.every(so => so.status === 'delivered');
    const allShipped = subOrders.every(so => so.status === 'shipped' || so.status === 'delivered');
    const someShipped = subOrders.some(so => 
        so.status === 'shipped' || so.status === 'delivered' || so.status === 'partial_shipped'
    );
    
    if (allDelivered) {
        order.status = 'completed';
    } else if (allShipped) {
        order.status = 'shipped';
    } else if (someShipped) {
        order.status = 'partial_shipped';
    }
    
    order.updateTime = new Date().toISOString();
}

// 极速退款 - 待发货订单直接退款，无需审核
// 参数: subOrderId
function instantRefund(subOrderId) {
    const subOrder = DB.subOrders.find(so => so.id === subOrderId);
    if (!subOrder) return { success: false, error: '子订单不存在' };
    
    const order = DB.orders.find(o => o.id === subOrder.parentOrderId);
    if (!order) return { success: false, error: '订单不存在' };
    
    // 只有待发货状态才能极速退款
    if (subOrder.status !== 'pending_ship') {
        return { success: false, error: '只有待发货订单才能申请极速退款' };
    }
    
    // 检查是否已有进行中的售后
    const existingAS = DB.afterSales.find(as => 
        as.subOrderId === subOrderId && 
        !['completed', 'rejected'].includes(as.status)
    );
    if (existingAS) return { success: false, error: '该订单已有进行中的售后申请' };
    
    // 计算全额退款金额（所有商品）
    const items = subOrder.items.map(item => ({
        productId: item.productId,
        qty: item.qty
    }));
    
    const refundInfo = calculateFullRefundInfo(subOrder, items);
    
    // 创建售后单（直接完成状态）
    const afterSaleId = generateAfterSaleId();
    const now = new Date().toISOString();
    
    const afterSale = {
        id: afterSaleId,
        orderId: order.id,
        subOrderId: subOrderId,
        userId: DB.user.id,
        merchantId: order.merchantId,
        type: 'refund_only',
        status: 'completed', // 直接完成
        reason: '待发货极速退款',
        description: '商品未发货，申请极速退款',
        items: subOrder.items.map(item => ({
            productId: item.productId,
            qty: item.qty,
            name: item.name,
            spec: item.spec,
            price: item.price,
            img: item.img
        })),
        itemsAmount: refundInfo.itemsAmount,
        discountAmount: refundInfo.discountAmount,
        refundAmount: refundInfo.refundAmount,
        refundPointsAmount: refundInfo.refundPointsAmount,
        refundCardAmount: refundInfo.refundCardAmount,
        refundCashAmount: refundInfo.refundCashAmount,
        // 退货信息（不需要）
        returnAddress: null,
        returnContact: null,
        returnPhone: null,
        returnExpressCompany: '',
        returnTrackingNo: '',
        returnTime: null,
        receiveTime: null,
        // 换货发货信息（不需要）
        exchangeExpressCompany: '',
        exchangeTrackingNo: '',
        exchangeShipTime: null,
        exchangeReceiveTime: null,
        // 审核信息（自动审核通过）
        reviewRemark: '待发货极速退款，系统自动处理',
        rejectReason: '',
        reviewTime: now,
        reviewBy: '系统',
        completeTime: now,
        createTime: now,
        updateTime: now
    };
    
    DB.afterSales.push(afterSale);
    
    // 执行退款
    executeRefund(afterSale);
    
    // 更新子订单状态
    subOrder.status = 'refunded';
    subOrder.refundTime = now;
    
    // 恢复库存
    subOrder.items.forEach(item => {
        const product = DB.products.find(p => p.id === item.productId);
        if (product) {
            product.stock += item.qty;
            product.sales -= item.qty;
        }
    });
    
    // 更新父订单状态
    const allSubOrders = DB.subOrders.filter(so => so.parentOrderId === order.id);
    const allRefunded = allSubOrders.every(so => so.status === 'refunded');
    if (allRefunded) {
        order.status = 'refunded';
    }
    
    order.updateTime = now;
    saveData();
    
    return { 
        success: true, 
        afterSaleId: afterSaleId, 
        afterSale: afterSale,
        refundInfo: refundInfo
    };
}

// 售后原因分类 - 用于判断运费责任
const AFTER_SALE_REASON_TYPES = {
    // 供应商责任（运费由供应商承担）
    SUPPLIER: ['商品质量问题', '商品与描述不符', '收到商品破损', '发错货/漏发'],
    // 买家责任（运费由买家承担）
    BUYER: ['不想要了', '买错了', '尺码/颜色选错', '七天无理由退换', '其他原因']
};

// 判断运费责任方
function getFreightResponsibility(reason) {
    if (AFTER_SALE_REASON_TYPES.SUPPLIER.includes(reason)) {
        return 'supplier';  // 供应商责任
    }
    return 'buyer';  // 买家责任
}

// 申请售后 - 支持仅退款、退货退款、换货
// 参数: subOrderId, type, items, reason, description, refundInfo(可选，预计算的退款信息), images(可选，图片数组)
function applyAfterSale(subOrderId, type, items, reason, description, refundInfo, images) {
    const subOrder = DB.subOrders.find(so => so.id === subOrderId);
    if (!subOrder) return { success: false, error: '子订单不存在' };
    
    const order = DB.orders.find(o => o.id === subOrder.parentOrderId);
    if (!order) return { success: false, error: '订单不存在' };
    
    // 检查是否已有进行中的售后
    const existingAS = DB.afterSales.find(as => 
        as.subOrderId === subOrderId && 
        !['completed', 'rejected'].includes(as.status)
    );
    if (existingAS) return { success: false, error: '该订单已有进行中的售后申请' };
    
    // 判断是否为待发货状态（待发货状态退邮费）
    const isPendingShip = subOrder.status === 'pending_ship';
    
    // 使用预计算的退款信息，或者重新计算
    let itemsAmount, discountAmount, refundAmount, refundPointsAmount, refundCardAmount, refundCashAmount, freightRefund;
    
    if (refundInfo) {
        // 使用传入的预计算退款信息
        itemsAmount = refundInfo.itemsAmount || 0;
        discountAmount = refundInfo.discountAmount || 0;
        freightRefund = refundInfo.freightRefund || 0;
        refundAmount = type === 'exchange' ? 0 : (refundInfo.refundAmount || 0);
        refundPointsAmount = type === 'exchange' ? 0 : (refundInfo.refundPointsAmount || 0);
        refundCardAmount = type === 'exchange' ? 0 : (refundInfo.refundCardAmount || 0);
        refundCashAmount = type === 'exchange' ? 0 : (refundInfo.refundCashAmount || 0);
    } else {
        // 重新计算退款金额
        itemsAmount = items.reduce((sum, item) => {
            const orderItem = subOrder.items.find(oi => oi.productId === item.productId);
            return sum + (orderItem ? orderItem.price * item.qty : 0);
        }, 0);
        
        // 计算退款商品占子订单的比例
        const subOrderTotal = subOrder.amount || subOrder.items.reduce((sum, item) => sum + item.price * item.qty, 0);
        const ratio = subOrderTotal > 0 ? itemsAmount / subOrderTotal : 1;
        
        // 待发货状态全额退邮费，已发货状态不退邮费
        freightRefund = 0;
        if (isPendingShip && type !== 'exchange') {
            // 待发货状态，按比例退邮费
            freightRefund = Math.round((subOrder.freight || 0) * ratio * 100) / 100;
        }
        
        // 按比例计算各支付方式的退款金额（包含邮费）
        const totalRefundable = itemsAmount + freightRefund;
        const paymentTotal = (subOrder.pointsDeduct || 0) + (subOrder.cardDeduct || 0) + (subOrder.cashPaid || 0);
        const paymentRatio = paymentTotal > 0 ? totalRefundable / (subOrderTotal + (subOrder.freight || 0)) : ratio;
        
        refundPointsAmount = type === 'exchange' ? 0 : Math.round((subOrder.pointsDeduct || 0) * paymentRatio * 100) / 100;
        refundCardAmount = type === 'exchange' ? 0 : Math.round((subOrder.cardDeduct || 0) * paymentRatio * 100) / 100;
        refundCashAmount = type === 'exchange' ? 0 : Math.round((subOrder.cashPaid || 0) * paymentRatio * 100) / 100;
        
        // 计算优惠分摊
        const totalDiscount = (subOrder.couponDeduct || 0);
        discountAmount = Math.round(totalDiscount * ratio * 100) / 100;
        
        // 实际退款金额
        refundAmount = type === 'exchange' ? 0 : (refundPointsAmount + refundCardAmount + refundCashAmount);
    }
    
    // 判断运费责任方
    const reasonType = getFreightResponsibility(reason) === 'supplier' ? 'supplier' : 'buyer';
    const freightResponsibility = getFreightResponsibility(reason);
    
    // 计算退款范围
    const totalItemQty = items.reduce((sum, item) => sum + item.qty, 0);
    const subOrderTotalQty = subOrder.items.reduce((sum, item) => sum + item.qty, 0);
    const isFullRefund = totalItemQty >= subOrderTotalQty;
    const scope = isFullRefund ? 'full' : (items.length < subOrder.items.length ? 'partial_sku' : 'partial_qty');
    
    const afterSaleId = generateAfterSaleId();
    const afterSale = {
        id: afterSaleId,
        orderId: order.id,
        subOrderId: subOrderId,
        userId: DB.user.id,
        merchantId: order.merchantId,
        storeId: order.storeId,
        storeName: order.storeName,
        type: type, // 'refund_only', 'return_refund', 'exchange'
        scope: scope, // 'full', 'partial_sku', 'partial_qty'
        // 状态: pending, approved, rejected, waiting_return, returning, received, reshipping, completed
        status: 'pending',
        reason: reason,
        reasonType: reasonType, // 'supplier' 或 'buyer'
        description: description || '',
        images: images || [], // 售后凭证图片
        items: items.map(item => {
            const orderItem = subOrder.items.find(oi => oi.productId === item.productId);
            return {
                productId: item.productId,
                qty: item.qty,
                originalQty: orderItem ? orderItem.qty : item.qty,
                name: orderItem ? orderItem.name : '',
                spec: orderItem ? orderItem.spec : '',
                price: orderItem ? orderItem.price : 0,
                img: orderItem ? orderItem.img : ''
            };
        }),
        itemsAmount: itemsAmount,
        freightRefund: freightRefund, // 邮费退款（待发货状态）
        discountAmount: discountAmount,
        refundAmount: refundAmount,
        refundPointsAmount: refundPointsAmount,
        refundCardAmount: refundCardAmount,
        refundCashAmount: refundCashAmount,
        // 自定义退款金额（已发货订单）
        customRefundAmount: refundInfo && refundInfo.customRefundAmount ? refundInfo.customRefundAmount : null,
        needsApproval: refundInfo && refundInfo.needsApproval ? true : false,
        // 运费责任
        freightResponsibility: freightResponsibility, // 'supplier' 或 'buyer'
        freightCompensation: 0, // 运费补贴金额（供应商责任时）
        freightCompensationStatus: '', // 补贴状态：pending/paid
        // 清分退款明细（退款完成后填充）
        clearingRefund: null,
        // 退货信息
        returnAddress: null,
        returnContact: null,
        returnPhone: null,
        returnExpressCompany: '',
        returnTrackingNo: '',
        returnTime: null,
        receiveTime: null,
        // 换货发货信息
        exchangeExpressCompany: '',
        exchangeTrackingNo: '',
        exchangeShipTime: null,
        exchangeReceiveTime: null,
        // 审核信息
        reviewRemark: '',
        rejectReason: '',
        reviewTime: null,
        reviewBy: '',
        // 时间线
        createTime: new Date().toISOString(),
        auditTime: null,
        refundTime: null,
        completeTime: null,
        updateTime: new Date().toISOString()
    };
    
    DB.afterSales.push(afterSale);
    saveData();
    
    return { success: true, afterSaleId: afterSaleId, afterSale: afterSale };
}

// 审核售后 (平台操作)
function reviewAfterSale(afterSaleId, approved, returnAddress, remark) {
    const afterSale = DB.afterSales.find(as => as.id === afterSaleId);
    if (!afterSale) return { success: false, error: '售后单不存在' };
    
    const now = new Date().toISOString();
    
    if (approved) {
        if (afterSale.type === 'refund_only') {
            // 仅退款：直接完成
            afterSale.status = 'completed';
            processRefund(afterSale);
        } else {
            // 退货退款/换货：进入待寄回状态
            afterSale.status = 'waiting_return';
            // 解析退货地址
            if (typeof returnAddress === 'object') {
                afterSale.returnAddress = returnAddress.address;
                afterSale.returnContact = returnAddress.contact;
                afterSale.returnPhone = returnAddress.phone;
            } else {
                afterSale.returnAddress = returnAddress;
            }
        }
        afterSale.reviewRemark = remark || '';
    } else {
        afterSale.status = 'rejected';
        afterSale.rejectReason = remark || '';
    }
    
    afterSale.reviewTime = now;
    afterSale.updateTime = now;
    saveData();
    
    return { success: true };
}

// 处理退款 - 包含冲账记录和订单状态更新
function processRefund(afterSale) {
    const now = new Date().toISOString();
    
    // 退还积分
    if (afterSale.refundPointsAmount > 0) {
        DB.user.points += afterSale.refundPointsAmount * 100;
    }
    // 退还卡金
    if (afterSale.refundCardAmount > 0) {
        DB.user.cardBalance += afterSale.refundCardAmount;
    }
    // 现金退款 (模拟)
    console.log('现金退款:', afterSale.refundCashAmount);
    
    // 记录退款时间
    afterSale.refundTime = now;
    afterSale.completeTime = now;
    
    // V2.0: 更新 SKU 级别清分状态并生成冲账记录
    const subOrder = DB.subOrders.find(so => so.id === afterSale.subOrderId);
    if (subOrder && afterSale.items) {
        // 计算清分退款明细
        let clearingRefund = {
            platformAmount: 0,
            operationAmount: 0,
            headquarterAmount: 0,
            storeProfit: 0,
            directCommission: 0,
            indirectCommission: 0,
            refundRecords: []
        };
        
        afterSale.items.forEach(refundItem => {
            const orderItem = subOrder.items.find(oi => oi.productId === refundItem.productId);
            if (orderItem && orderItem.clearing) {
                // 计算退款比例
                const qtyRatio = orderItem.qty > 0 ? refundItem.qty / orderItem.qty : 0;
                const isFullRefund = qtyRatio >= 1;
                
                // 计算各方退款金额
                const platformRefund = Math.round((orderItem.clearing.platformAmount || 0) * qtyRatio * 100) / 100;
                const operationRefund = Math.round((orderItem.clearing.operationAmount || 0) * qtyRatio * 100) / 100;
                const headquarterRefund = Math.round((orderItem.clearing.headquarterAmount || 0) * qtyRatio * 100) / 100;
                const storeProfitRefund = Math.round((orderItem.clearing.storeProfit || 0) * qtyRatio * 100) / 100;
                const directCommissionRefund = Math.round((orderItem.clearing.directCommission || 0) * qtyRatio * 100) / 100;
                const indirectCommissionRefund = Math.round((orderItem.clearing.indirectCommission || 0) * qtyRatio * 100) / 100;
                
                // 累加到总退款
                clearingRefund.platformAmount += platformRefund;
                clearingRefund.operationAmount += operationRefund;
                clearingRefund.headquarterAmount += headquarterRefund;
                clearingRefund.storeProfit += storeProfitRefund;
                clearingRefund.directCommission += directCommissionRefund;
                clearingRefund.indirectCommission += indirectCommissionRefund;
                
                // 生成冲账记录
                const refundRecord = {
                    id: `CLR_REF_${Date.now()}_${refundItem.productId}`,
                    type: 'refund',
                    refundType: isFullRefund ? 'full' : 'partial',
                    subOrderId: subOrder.id,
                    skuId: refundItem.productId,
                    skuName: refundItem.name,
                    relatedClearingId: orderItem.clearing.id || null,
                    afterSaleId: afterSale.id,
                    refundQty: refundItem.qty,
                    originalQty: orderItem.qty,
                    refundRatio: qtyRatio,
                    // 清分金额（负数）
                    platformAmount: -platformRefund,
                    operationAmount: -operationRefund,
                    headquarterAmount: -headquarterRefund,
                    storeProfit: -storeProfitRefund,
                    directCommission: -directCommissionRefund,
                    indirectCommission: -indirectCommissionRefund,
                    refundReason: afterSale.reason,
                    status: 'settled',
                    createTime: now
                };
                
                clearingRefund.refundRecords.push(refundRecord);
                
                // 更新 SKU 清分状态
                if (!orderItem.clearing.refundInfo) {
                    orderItem.clearing.refundInfo = {
                        totalRefundQty: 0,
                        totalRefundRatio: 0,
                        refundRecords: []
                    };
                }
                
                orderItem.clearing.refundInfo.totalRefundQty += refundItem.qty;
                orderItem.clearing.refundInfo.totalRefundRatio += qtyRatio;
                orderItem.clearing.refundInfo.refundRecords.push({
                    afterSaleId: afterSale.id,
                    refundQty: refundItem.qty,
                    refundRatio: qtyRatio,
                    platformRefund: platformRefund,
                    operationRefund: operationRefund,
                    headquarterRefund: headquarterRefund,
                    storeProfitRefund: storeProfitRefund,
                    directCommissionRefund: directCommissionRefund,
                    indirectCommissionRefund: indirectCommissionRefund,
                    refundTime: now
                });
                
                // 更新 SKU 清分状态
                if (orderItem.clearing.refundInfo.totalRefundRatio >= 1) {
                    orderItem.clearing.status = 'refunded';
                } else {
                    orderItem.clearing.status = 'partial_refunded';
                }
            }
        });
        
        // 保存清分退款明细到售后单
        afterSale.clearingRefund = clearingRefund;
        
        // 更新子订单汇总清分状态
        updateSubOrderClearingStatus(subOrder);
        
        // 更新子订单状态（全额退款时）
        updateSubOrderStatusAfterRefund(subOrder, afterSale);
        
        // 更新主订单状态
        updateMainOrderStatusAfterRefund(afterSale.orderId);
    }
    
    saveData();
}

// 更新子订单状态（退款后）
function updateSubOrderStatusAfterRefund(subOrder, afterSale) {
    if (!subOrder) return;
    
    // 检查是否所有SKU都已退款
    const allRefunded = subOrder.items.every(item => 
        item.clearing && item.clearing.status === 'refunded'
    );
    
    if (allRefunded) {
        // 全额退款，更新子订单状态为 refunded
        subOrder.status = 'refunded';
        subOrder.updateTime = new Date().toISOString();
    }
    // 部分退款不改变子订单状态
}

// 更新主订单状态（退款后）
function updateMainOrderStatusAfterRefund(orderId) {
    const order = DB.orders.find(o => o.id === orderId);
    if (!order) return;
    
    const subOrders = DB.subOrders.filter(so => so.parentOrderId === orderId);
    if (subOrders.length === 0) return;
    
    // 统计子订单状态
    const allRefunded = subOrders.every(so => so.status === 'refunded');
    const hasRefunded = subOrders.some(so => so.status === 'refunded');
    const allDelivered = subOrders.every(so => so.status === 'delivered');
    const allShipped = subOrders.every(so => ['shipped', 'delivered'].includes(so.status));
    const hasShipped = subOrders.some(so => ['shipped', 'delivered', 'partial_shipped'].includes(so.status));
    
    let newStatus = order.status;
    
    if (allRefunded) {
        newStatus = 'refunded';           // 全部退款
    } else if (hasRefunded) {
        newStatus = 'partial_refunded';   // 部分退款
    } else if (allDelivered) {
        newStatus = 'completed';          // 已完成
    } else if (allShipped) {
        newStatus = 'shipped';            // 已发货
    } else if (hasShipped) {
        newStatus = 'partial_shipped';    // 部分发货
    }
    
    if (order.status !== newStatus) {
        order.status = newStatus;
        order.updateTime = new Date().toISOString();
    }
}

// V2.0: 更新子订单汇总清分状态
function updateSubOrderClearingStatus(subOrder) {
    if (!subOrder || !subOrder.items || !subOrder.clearing) return;
    
    // 统计各状态的 SKU 数量
    let frozenCount = 0, settledCount = 0, refundedCount = 0, partialRefundedCount = 0;
    subOrder.items.forEach(item => {
        if (item.clearing) {
            switch (item.clearing.status) {
                case 'frozen': frozenCount++; break;
                case 'settled': settledCount++; break;
                case 'refunded': refundedCount++; break;
                case 'partial_refunded': partialRefundedCount++; break;
            }
        }
    });
    
    const totalItems = subOrder.items.length;
    
    // 确定子订单汇总状态
    if (refundedCount === totalItems) {
        subOrder.clearing.status = 'refunded';
    } else if (refundedCount > 0 || partialRefundedCount > 0) {
        subOrder.clearing.status = 'partial_refunded';
    } else if (settledCount === totalItems) {
        subOrder.clearing.status = 'settled';
    } else {
        subOrder.clearing.status = 'frozen';
    }
    
    subOrder.clearing.updateTime = new Date().toISOString();
}

// 填写退货物流 (消费者操作)
function submitReturnTracking(afterSaleId, expressCompany, trackingNo) {
    const afterSale = DB.afterSales.find(as => as.id === afterSaleId);
    if (!afterSale) return { success: false, error: '售后单不存在' };
    
    if (afterSale.status !== 'waiting_return') {
        return { success: false, error: '当前状态不允许填写物流' };
    }
    
    afterSale.returnExpressCompany = expressCompany || '顺丰快递';
    afterSale.returnTrackingNo = trackingNo;
    afterSale.returnTime = new Date().toISOString();
    afterSale.status = 'returning';
    afterSale.updateTime = new Date().toISOString();
    saveData();
    
    return { success: true };
}

// 确认收货 (平台操作 - 退货退款/换货)
function confirmReturnReceive(afterSaleId, accepted, remark) {
    const afterSale = DB.afterSales.find(as => as.id === afterSaleId);
    if (!afterSale) return { success: false, error: '售后单不存在' };
    
    if (afterSale.status !== 'returning') {
        return { success: false, error: '当前状态不允许确认收货' };
    }
    
    const now = new Date().toISOString();
    afterSale.receiveTime = now;
    
    if (accepted) {
        if (afterSale.type === 'return_refund') {
            // 退货退款：确认收货后直接退款
            afterSale.status = 'completed';
            processRefund(afterSale);
        } else if (afterSale.type === 'exchange') {
            // 换货：进入待重新发货状态
            afterSale.status = 'received';
        }
    } else {
        // 拒绝收货（商品有问题）
        afterSale.status = 'rejected';
        afterSale.rejectReason = remark || '退回商品不符合要求';
    }
    
    afterSale.updateTime = now;
    saveData();
    
    return { success: true };
}

// 换货发货 (平台操作)
function shipExchange(afterSaleId, expressCompany, trackingNo) {
    const afterSale = DB.afterSales.find(as => as.id === afterSaleId);
    if (!afterSale) return { success: false, error: '售后单不存在' };
    
    if (afterSale.type !== 'exchange' || afterSale.status !== 'received') {
        return { success: false, error: '当前状态不允许发货' };
    }
    
    afterSale.exchangeExpressCompany = expressCompany;
    afterSale.exchangeTrackingNo = trackingNo;
    afterSale.exchangeShipTime = new Date().toISOString();
    afterSale.status = 'reshipping';
    afterSale.updateTime = new Date().toISOString();
    saveData();
    
    return { success: true };
}

// 确认换货收货 (消费者操作)
function confirmExchangeReceive(afterSaleId) {
    const afterSale = DB.afterSales.find(as => as.id === afterSaleId);
    if (!afterSale) return { success: false, error: '售后单不存在' };
    
    if (afterSale.status !== 'reshipping') {
        return { success: false, error: '当前状态不允许确认收货' };
    }
    
    afterSale.exchangeReceiveTime = new Date().toISOString();
    afterSale.status = 'completed';
    afterSale.updateTime = new Date().toISOString();
    saveData();
    
    return { success: true };
}

// 撤销售后申请 (消费者操作)
function cancelAfterSale(afterSaleId) {
    const afterSale = DB.afterSales.find(as => as.id === afterSaleId);
    if (!afterSale) return { success: false, error: '售后单不存在' };
    
    if (afterSale.status !== 'pending' && afterSale.status !== 'approved' && afterSale.status !== 'waiting_return') {
        return { success: false, error: '当前状态不允许撤销' };
    }
    
    // 不删除记录，而是更新状态为已撤销
    afterSale.status = 'cancelled';
    afterSale.cancelTime = new Date().toISOString();
    afterSale.updateTime = new Date().toISOString();
    afterSale.cancelReason = '用户主动撤销';
    
    saveData();
    
    return { success: true };
}

// 完成售后 (兼容旧接口)
function completeAfterSale(afterSaleId) {
    const afterSale = DB.afterSales.find(as => as.id === afterSaleId);
    if (!afterSale) return { success: false, error: '售后单不存在' };
    
    afterSale.status = 'completed';
    afterSale.updateTime = new Date().toISOString();
    if (afterSale.type !== 'exchange') {
        processRefund(afterSale);
    }
    saveData();
    
    return { success: true };
}

// 获取订单列表
function getOrders(filter = {}) {
    let orders = [...DB.orders];
    
    if (filter.status) {
        orders = orders.filter(o => o.status === filter.status);
    }
    if (filter.merchantId) {
        orders = orders.filter(o => o.merchantId === filter.merchantId);
    }
    if (filter.userId) {
        orders = orders.filter(o => o.userId === filter.userId);
    }
    
    // 附加子订单信息
    return orders.map(order => ({
        ...order,
        subOrders: DB.subOrders.filter(so => so.parentOrderId === order.id)
    })).sort((a, b) => new Date(b.createTime) - new Date(a.createTime));
}

// 获取全局订单列表（用于平台后台，不受用户隔离影响）
function getAllOrders(filter = {}) {
    // 直接从localStorage读取全局数据
    const saved = localStorage.getItem('s2b2c_prototype_data');
    let allOrders = [];
    let allSubOrders = [];
    
    if (saved) {
        try {
            const data = JSON.parse(saved);
            allOrders = data.orders || [];
            allSubOrders = data.subOrders || [];
        } catch (e) {
            console.error('读取全局订单数据失败:', e);
        }
    }
    
    // 同时从所有用户的数据中收集订单
    const allUsers = Object.keys(TEST_USERS);
    allUsers.forEach(userId => {
        const userSaved = localStorage.getItem('s2b2c_user_' + userId);
        if (userSaved) {
            try {
                const userData = JSON.parse(userSaved);
                if (userData.orders) {
                    // 避免重复添加（以订单ID为准）
                    userData.orders.forEach(order => {
                        if (!allOrders.find(o => o.id === order.id)) {
                            allOrders.push(order);
                        }
                    });
                }
                if (userData.subOrders) {
                    userData.subOrders.forEach(subOrder => {
                        if (!allSubOrders.find(so => so.id === subOrder.id)) {
                            allSubOrders.push(subOrder);
                        }
                    });
                }
            } catch (e) {
                console.error(`读取用户${userId}数据失败:`, e);
            }
        }
    });
    
    // 应用过滤条件
    let orders = [...allOrders];
    if (filter.status) {
        orders = orders.filter(o => o.status === filter.status);
    }
    if (filter.merchantId) {
        orders = orders.filter(o => o.merchantId === filter.merchantId);
    }
    if (filter.userId) {
        orders = orders.filter(o => o.userId === filter.userId);
    }
    
    // 附加子订单信息
    return orders.map(order => ({
        ...order,
        subOrders: allSubOrders.filter(so => so.parentOrderId === order.id)
    })).sort((a, b) => new Date(b.createTime) - new Date(a.createTime));
}

// 获取全局子订单列表（用于平台后台）
function getAllSubOrders(filter = {}) {
    // 直接从localStorage读取全局数据
    const saved = localStorage.getItem('s2b2c_prototype_data');
    let allSubOrders = [];
    
    if (saved) {
        try {
            const data = JSON.parse(saved);
            allSubOrders = data.subOrders || [];
        } catch (e) {
            console.error('读取全局子订单数据失败:', e);
        }
    }
    
    // 同时从所有用户的数据中收集子订单
    const allUsers = Object.keys(TEST_USERS);
    allUsers.forEach(userId => {
        const userSaved = localStorage.getItem('s2b2c_user_' + userId);
        if (userSaved) {
            try {
                const userData = JSON.parse(userSaved);
                if (userData.subOrders) {
                    userData.subOrders.forEach(subOrder => {
                        if (!allSubOrders.find(so => so.id === subOrder.id)) {
                            allSubOrders.push(subOrder);
                        }
                    });
                }
            } catch (e) {
                console.error(`读取用户${userId}子订单数据失败:`, e);
            }
        }
    });
    
    // 应用过滤条件
    let subOrders = [...allSubOrders];
    if (filter.status) {
        subOrders = subOrders.filter(so => so.status === filter.status);
    }
    if (filter.supplierId) {
        subOrders = subOrders.filter(so => so.supplierId === filter.supplierId);
    }
    
    return subOrders.sort((a, b) => new Date(b.createTime) - new Date(a.createTime));
}

// 获取全局售后列表（用于平台后台）
function getAllAfterSales(filter = {}) {
    // 直接从localStorage读取全局数据
    const saved = localStorage.getItem('s2b2c_prototype_data');
    let allAfterSales = [];
    
    if (saved) {
        try {
            const data = JSON.parse(saved);
            allAfterSales = data.afterSales || [];
        } catch (e) {
            console.error('读取全局售后数据失败:', e);
        }
    }
    
    // 同时从所有用户的数据中收集售后
    const allUsers = Object.keys(TEST_USERS);
    allUsers.forEach(userId => {
        const userSaved = localStorage.getItem('s2b2c_user_' + userId);
        if (userSaved) {
            try {
                const userData = JSON.parse(userSaved);
                if (userData.afterSales) {
                    userData.afterSales.forEach(afterSale => {
                        if (!allAfterSales.find(as => as.id === afterSale.id)) {
                            allAfterSales.push(afterSale);
                        }
                    });
                }
            } catch (e) {
                console.error(`读取用户${userId}售后数据失败:`, e);
            }
        }
    });
    
    // 应用过滤条件
    let afterSales = [...allAfterSales];
    if (filter.status) {
        afterSales = afterSales.filter(as => as.status === filter.status);
    }
    if (filter.merchantId) {
        afterSales = afterSales.filter(as => as.merchantId === filter.merchantId);
    }
    
    return afterSales.sort((a, b) => new Date(b.createTime) - new Date(a.createTime));
}

// 全局查找函数（用于平台后台）
function findGlobalSubOrder(subOrderId) {
    // 先从当前DB中查找
    let subOrder = DB.subOrders.find(so => so.id === subOrderId);
    if (subOrder) return subOrder;
    
    // 从localStorage全局数据中查找
    const saved = localStorage.getItem('s2b2c_prototype_data');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            subOrder = (data.subOrders || []).find(so => so.id === subOrderId);
            if (subOrder) return subOrder;
        } catch (e) {
            console.error('读取全局子订单数据失败:', e);
        }
    }
    
    // 从所有用户数据中查找
    const allUsers = Object.keys(TEST_USERS);
    for (const userId of allUsers) {
        const userSaved = localStorage.getItem('s2b2c_user_' + userId);
        if (userSaved) {
            try {
                const userData = JSON.parse(userSaved);
                if (userData.subOrders) {
                    subOrder = userData.subOrders.find(so => so.id === subOrderId);
                    if (subOrder) return subOrder;
                }
            } catch (e) {
                console.error(`读取用户${userId}子订单数据失败:`, e);
            }
        }
    }
    
    return null;
}

function findGlobalAfterSale(afterSaleId) {
    // 先从当前DB中查找
    let afterSale = DB.afterSales.find(as => as.id === afterSaleId);
    if (afterSale) return afterSale;
    
    // 从localStorage全局数据中查找
    const saved = localStorage.getItem('s2b2c_prototype_data');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            afterSale = (data.afterSales || []).find(as => as.id === afterSaleId);
            if (afterSale) return afterSale;
        } catch (e) {
            console.error('读取全局售后数据失败:', e);
        }
    }
    
    // 从所有用户数据中查找
    const allUsers = Object.keys(TEST_USERS);
    for (const userId of allUsers) {
        const userSaved = localStorage.getItem('s2b2c_user_' + userId);
        if (userSaved) {
            try {
                const userData = JSON.parse(userSaved);
                if (userData.afterSales) {
                    afterSale = userData.afterSales.find(as => as.id === afterSaleId);
                    if (afterSale) return afterSale;
                }
            } catch (e) {
                console.error(`读取用户${userId}售后数据失败:`, e);
            }
        }
    }
    
    return null;
}

// 批量查找全局子订单
function findGlobalSubOrdersByIds(subOrderIds) {
    if (!subOrderIds || !Array.isArray(subOrderIds)) return [];
    
    const allSubOrders = getAllSubOrders();
    return subOrderIds.map(id => allSubOrders.find(so => so.id === id)).filter(Boolean);
}

// 获取子订单列表
function getSubOrders(filter = {}) {
    let subOrders = [...DB.subOrders];
    
    if (filter.status) {
        subOrders = subOrders.filter(so => so.status === filter.status);
    }
    if (filter.supplierId) {
        subOrders = subOrders.filter(so => so.supplierId === filter.supplierId);
    }
    
    return subOrders.sort((a, b) => new Date(b.createTime) - new Date(a.createTime));
}

// 获取售后列表
function getAfterSales(filter = {}) {
    let afterSales = [...DB.afterSales];
    
    if (filter.status) {
        afterSales = afterSales.filter(as => as.status === filter.status);
    }
    if (filter.merchantId) {
        afterSales = afterSales.filter(as => as.merchantId === filter.merchantId);
    }
    
    return afterSales.sort((a, b) => new Date(b.createTime) - new Date(a.createTime));
}

// 获取统计数据
function getStatistics() {
    const today = new Date().toISOString().split('T')[0];
    const todayOrders = DB.orders.filter(o => o.createTime.startsWith(today));
    
    return {
        todayOrderCount: todayOrders.length,
        todayGMV: todayOrders.reduce((sum, o) => sum + o.totalAmount, 0),
        pendingShipCount: DB.subOrders.filter(so => so.status === 'pending_ship').length,
        pendingAfterSaleCount: DB.afterSales.filter(as => as.status === 'pending').length,
        totalOrders: DB.orders.length,
        totalGMV: DB.orders.reduce((sum, o) => sum + o.totalAmount, 0)
    };
}

// 获取平台清分统计数据
function getPlatformClearingStats(dateFilter = null) {
    // 获取所有已支付的供应链订单
    let orders = DB.orders.filter(o => o.type === 'supply' && o.status !== 'pending_pay' && o.status !== 'cancelled');
    
    // 日期筛选
    if (dateFilter && dateFilter.start) {
        orders = orders.filter(o => o.createTime >= dateFilter.start);
    }
    if (dateFilter && dateFilter.end) {
        orders = orders.filter(o => o.createTime <= dateFilter.end + 'T23:59:59');
    }
    
    // 汇总清分数据
    let totalAmount = 0;           // 交易总额
    let orderCount = 0;            // 订单数
    let platformAmount = 0;        // 平台货款（贸易公司代收）
    let tradingCompanyAmount = 0;  // 贸易公司实得
    let distributorAmount = 0;     // 经销商应得
    let operationAmount = 0;       // 代运营费用
    let headquarterAmount = 0;     // 连锁总部分成
    let merchantProfit = 0;        // 商家毛利
    let merchantNetProfit = 0;     // 商家净利润
    let directCommission = 0;      // 直推佣金
    let indirectCommission = 0;    // 间推佣金
    let paymentFee = 0;            // 支付手续费
    let totalDepositDeduct = 0;    // 保证金扣除总额
    let totalSplitAmount = 0;      // 空中分账总额
    let merchantCashRetain = 0;    // 商家保留现金
    let totalCash = 0;             // 现金支付总额
    
    orders.forEach(o => {
        totalAmount += o.totalAmount || 0;
        orderCount++;
        totalCash += o.cashPaid || 0;
        
        // 获取子订单
        const subOrders = (o.subOrderIds || []).map(id => DB.subOrders.find(so => so.id === id)).filter(Boolean);
        
        subOrders.forEach(so => {
            if (so.clearing) {
                // 使用清分数据
                platformAmount += so.clearing.platformAmount || 0;
                tradingCompanyAmount += so.clearing.tradingCompanyAmount || 0;
                distributorAmount += so.clearing.distributorAmount || 0;
                operationAmount += so.clearing.operationAmount || 0;
                headquarterAmount += so.clearing.headquarterAmount || 0;
                merchantProfit += so.clearing.merchantProfit || 0;
                merchantNetProfit += so.clearing.merchantNetProfit || 0;
                directCommission += so.clearing.directCommission || 0;
                indirectCommission += so.clearing.indirectCommission || 0;
                paymentFee += so.clearing.paymentFee || 0;
                totalDepositDeduct += so.clearing.totalDepositDeduct || 0;
                totalSplitAmount += so.clearing.totalSplitAmount || 0;
                merchantCashRetain += so.clearing.merchantCashRetain || 0;
            }
        });
    });
    
    // 推广员佣金总额
    const promoterCommission = directCommission + indirectCommission;
    
    // 平台净利润 = 代运营费用（平台视角的收入）
    const platformNetProfit = operationAmount;
    
    return {
        totalAmount,
        orderCount,
        totalCash,
        // 清分数据
        platformAmount,           // 平台货款（贸易公司代收）70%
        tradingCompanyAmount,     // 贸易公司实得（平台货款 × 80%）
        distributorAmount,        // 经销商应得（平台货款 × 20%，线下结算）
        operationAmount,          // 代运营费用 10%
        headquarterAmount,        // 连锁总部分成 8%
        merchantProfit,           // 商家毛利 12%
        merchantNetProfit,        // 商家净利润
        directCommission,         // 直推佣金
        indirectCommission,       // 间推佣金
        promoterCommission,       // 推广员佣金总额
        paymentFee,               // 支付手续费
        totalDepositDeduct,       // 保证金扣除总额
        totalSplitAmount,         // 空中分账总额
        merchantCashRetain,       // 商家保留现金
        platformNetProfit         // 平台净利润
    };
}

// 数据持久化 (使用 localStorage)
function saveData() {
    const data = {
        user: DB.user,
        cart: DB.cart,
        orders: DB.orders,
        subOrders: DB.subOrders,
        afterSales: DB.afterSales,
        products: DB.products,
        freightTemplates: DB.freightTemplates,
        freightTemplateLogs: DB.freightTemplateLogs,
        // V2.0 运费模板和不发货地区模板
        freightTemplatesV2: DB.freightTemplatesV2,
        noDeliveryTemplates: DB.noDeliveryTemplates,
        orderIdCounter: DB.orderIdCounter,
        subOrderIdCounter: DB.subOrderIdCounter,
        afterSaleIdCounter: DB.afterSaleIdCounter,
        // 售后配置
        afterSaleConfig: DB.afterSaleConfig
    };
    localStorage.setItem('s2b2c_prototype_data', JSON.stringify(data));
    
    // 同时保存当前用户的专属数据
    saveUserData(currentUserId);
}

// 保存单个用户的数据
function saveUserData(userId) {
    const userData = {
        cart: DB.cart,
        orders: DB.orders,
        subOrders: DB.subOrders,
        afterSales: DB.afterSales
    };
    localStorage.setItem('s2b2c_user_' + userId, JSON.stringify(userData));
}

// 加载单个用户的数据
function loadUserData(userId) {
    const saved = localStorage.getItem('s2b2c_user_' + userId);
    if (saved) {
        try {
            const userData = JSON.parse(saved);
            DB.cart = userData.cart || [];
            DB.orders = userData.orders || [];
            DB.subOrders = userData.subOrders || [];
            DB.afterSales = userData.afterSales || [];
        } catch (e) {
            console.error('加载用户数据失败:', e);
            // 如果加载失败，初始化为空
            DB.cart = [];
            DB.orders = [];
            DB.subOrders = [];
            DB.afterSales = [];
        }
    } else {
        // 新用户，初始化为空
        DB.cart = [];
        DB.orders = [];
        DB.subOrders = [];
        DB.afterSales = [];
    }
}

function loadData() {
    const saved = localStorage.getItem('s2b2c_prototype_data');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            DB.user = data.user || DB.user;
            DB.cart = data.cart || [];
            DB.orders = data.orders || [];
            DB.subOrders = data.subOrders || [];
            DB.afterSales = data.afterSales || [];
            
            // 加载商品数据，并确保包含运费模板字段
            if (data.products) {
                // 获取默认商品数据作为参考
                const defaultProducts = [
                    { id: 'P001', freightTemplateId: 'FT001', noDeliveryTemplateId: 'ND001', supplierId: 'S001' },
                    { id: 'P002', freightTemplateId: 'FT003', noDeliveryTemplateId: 'ND001', supplierId: 'S002' },
                    { id: 'P003', freightTemplateId: 'FT003', noDeliveryTemplateId: 'ND002', supplierId: 'S003' },
                    { id: 'P004', freightTemplateId: 'FT003', noDeliveryTemplateId: 'ND001', supplierId: 'S001' },
                    { id: 'P005', freightTemplateId: 'FT001', noDeliveryTemplateId: 'ND001', supplierId: 'S002' },
                    { id: 'P006', freightTemplateId: 'FT001', noDeliveryTemplateId: 'ND001', supplierId: 'S001' },
                    { id: 'P007', freightTemplateId: 'FT001', noDeliveryTemplateId: 'ND001', supplierId: 'S001' }
                ];
                
                // 合并数据，确保旧数据包含新字段
                DB.products = data.products.map(p => {
                    const defaultP = defaultProducts.find(dp => dp.id === p.id);
                    if (defaultP && p.type === 'supply') {
                        return {
                            ...p,
                            freightTemplateId: p.freightTemplateId || defaultP.freightTemplateId,
                            noDeliveryTemplateId: p.noDeliveryTemplateId || defaultP.noDeliveryTemplateId,
                            supplierId: p.supplierId || defaultP.supplierId
                        };
                    }
                    return p;
                });
            }
            
            DB.freightTemplates = data.freightTemplates || JSON.parse(JSON.stringify(FREIGHT_TEMPLATES));
            DB.freightTemplateLogs = data.freightTemplateLogs || [];
            // V2.0 运费模板和不发货地区模板
            DB.freightTemplatesV2 = data.freightTemplatesV2 || JSON.parse(JSON.stringify(FREIGHT_TEMPLATES_V2));
            DB.noDeliveryTemplates = data.noDeliveryTemplates || JSON.parse(JSON.stringify(NO_DELIVERY_TEMPLATES));
            DB.orderIdCounter = data.orderIdCounter || 1000;
            DB.subOrderIdCounter = data.subOrderIdCounter || 1;
            DB.afterSaleIdCounter = data.afterSaleIdCounter || 1;
            // 加载售后配置
            DB.afterSaleConfig = data.afterSaleConfig || JSON.parse(JSON.stringify(AFTERSALE_CONFIG));
            // 加载门店数据
            if (data.currentStoreId) {
                currentStoreId = data.currentStoreId;
                DB.currentStore = TEST_STORES[currentStoreId] ? JSON.parse(JSON.stringify(TEST_STORES[currentStoreId])) : DB.currentStore;
            }
        } catch (e) {
            console.error('加载数据失败:', e);
        }
    }
    // 加载当前用户的专属数据（订单、购物车等）
    loadUserData(currentUserId);
}

// 初始化多包裹测试数据
function initMultiPackageTestData() {
    const now = new Date();
    const orderId = 'TEST' + Date.now();
    const subOrderId = 'SUB' + Date.now();
    
    // 创建测试订单
    const testOrder = {
        id: orderId,
        userId: DB.user.id,
        type: 'supply',
        status: 'shipped',
        items: [
            { productId: 'P001', name: '韩国气垫BB霜', spec: '自然色/15g', price: 128, qty: 2, img: '💄', supplierId: 'S001' },
            { productId: 'P002', name: '日本防晒霜', spec: 'SPF50+/60ml', price: 89, qty: 1, img: '🧴', supplierId: 'S001' },
            { productId: 'P004', name: '法国香水', spec: '淡香/50ml', price: 299, qty: 1, img: '🌸', supplierId: 'S001' }
        ],
        totalAmount: 128 * 2 + 89 + 299,
        totalFreight: 0,
        address: DB.user.addresses[0],
        createTime: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        payTime: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        subOrderIds: [subOrderId],
        paymentPlan: {
            cashPayMethod: 'wechat',
            cardUsed: 0,
            cashAmount: 128 * 2 + 89 + 299
        }
    };
    
    // 创建测试子订单（带多包裹）
    const testSubOrder = {
        id: subOrderId,
        parentOrderId: orderId,
        supplierId: 'S001',
        status: 'shipped',
        items: testOrder.items,
        amount: testOrder.totalAmount,
        freight: 0,
        createTime: testOrder.createTime,
        // 多包裹数据
        packages: [
            {
                id: 'PKG001',
                expressCompany: '顺丰速运',
                trackingNo: 'SF' + Date.now() + '001',
                status: 'delivered',
                shipTime: new Date(now.getTime() - 1.5 * 24 * 60 * 60 * 1000).toISOString(),
                deliverTime: new Date(now.getTime() - 0.5 * 24 * 60 * 60 * 1000).toISOString(),
                items: [
                    { productId: 'P001', name: '韩国气垫BB霜', spec: '自然色/15g', price: 128, qty: 2, img: '💄' }
                ]
            },
            {
                id: 'PKG002',
                expressCompany: '中通快递',
                trackingNo: 'ZT' + Date.now() + '002',
                status: 'shipped',
                shipTime: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                items: [
                    { productId: 'P002', name: '日本防晒霜', spec: 'SPF50+/60ml', price: 89, qty: 1, img: '🧴' },
                    { productId: 'P004', name: '法国香水', spec: '淡香/50ml', price: 299, qty: 1, img: '🌸' }
                ]
            }
        ]
    };
    
    DB.orders.push(testOrder);
    DB.subOrders.push(testSubOrder);
    saveData();
    
    console.log('多包裹测试数据已创建:', { orderId, subOrderId });
    return { orderId, subOrderId };
}

// 初始化不同支付方式的测试订单
function initPaymentTestData() {
    const now = new Date();
    const results = [];
    
    // 1. 微信支付订单
    const wechatOrderId = 'WECHAT' + Date.now();
    const wechatSubOrderId = 'SUB_WECHAT' + Date.now();
    const wechatOrder = {
        id: wechatOrderId,
        userId: DB.user.id,
        type: 'supply',
        status: 'paid',
        items: [
            { productId: 'P001', name: '韩国气垫BB霜', spec: '自然色/15g', price: 128, qty: 1, img: '💄', supplierId: 'S001' }
        ],
        totalAmount: 128,
        totalFreight: 10,
        address: DB.user.addresses[0],
        createTime: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        payTime: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        subOrderIds: [wechatSubOrderId],
        paymentPlan: {
            cashPayMethod: 'wechat',
            cardUsed: 0,
            cashAmount: 138,
            pointsDeduct: 0,
            pointsUsed: 0
        }
    };
    const wechatSubOrder = {
        id: wechatSubOrderId,
        parentOrderId: wechatOrderId,
        supplierId: 'S001',
        status: 'pending_ship',
        items: wechatOrder.items,
        amount: 128,
        freight: 10,
        createTime: wechatOrder.createTime,
        packages: []
    };
    DB.orders.push(wechatOrder);
    DB.subOrders.push(wechatSubOrder);
    results.push({ type: '微信支付', orderId: wechatOrderId });
    
    // 2. 会员卡支付订单
    const cardOrderId = 'CARD' + Date.now();
    const cardSubOrderId = 'SUB_CARD' + Date.now();
    const cardOrder = {
        id: cardOrderId,
        userId: DB.user.id,
        type: 'supply',
        status: 'paid',
        items: [
            { productId: 'P002', name: '日本防晒霜', spec: 'SPF50+/60ml', price: 89, qty: 1, img: '🧴', supplierId: 'S001' }
        ],
        totalAmount: 89,
        totalFreight: 0,
        address: DB.user.addresses[0],
        createTime: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        payTime: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        subOrderIds: [cardSubOrderId],
        paymentPlan: {
            cashPayMethod: 'card',
            cardUsed: 89,
            cashAmount: 0,
            pointsDeduct: 0,
            pointsUsed: 0
        }
    };
    const cardSubOrder = {
        id: cardSubOrderId,
        parentOrderId: cardOrderId,
        supplierId: 'S001',
        status: 'shipped',
        items: cardOrder.items,
        amount: 89,
        freight: 0,
        createTime: cardOrder.createTime,
        packages: [{
            id: 'PKG_CARD',
            expressCompany: '顺丰速运',
            trackingNo: 'SF' + Date.now(),
            status: 'shipped',
            shipTime: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            items: [{ productId: 'P002', name: '日本防晒霜', spec: 'SPF50+/60ml', price: 89, qty: 1, img: '🧴' }]
        }]
    };
    DB.orders.push(cardOrder);
    DB.subOrders.push(cardSubOrder);
    results.push({ type: '会员卡支付', orderId: cardOrderId });
    
    // 3. 混合支付订单（卡金+微信）
    const mixOrderId = 'MIX' + Date.now();
    const mixSubOrderId = 'SUB_MIX' + Date.now();
    const mixOrder = {
        id: mixOrderId,
        userId: DB.user.id,
        type: 'supply',
        status: 'paid',
        items: [
            { productId: 'P004', name: '法国香水', spec: '淡香/50ml', price: 299, qty: 1, img: '🌸', supplierId: 'S002' }
        ],
        totalAmount: 299,
        totalFreight: 15,
        pointsDeduct: 10,
        address: DB.user.addresses[0],
        createTime: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        payTime: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        subOrderIds: [mixSubOrderId],
        paymentPlan: {
            cashPayMethod: 'wechat',
            cardUsed: 100,
            cashAmount: 174.1,
            pointsDeduct: 10,
            pointsUsed: 100
        }
    };
    const mixSubOrder = {
        id: mixSubOrderId,
        parentOrderId: mixOrderId,
        supplierId: 'S002',
        status: 'delivered',
        items: mixOrder.items,
        amount: 299,
        freight: 15,
        pointsDeduct: 10,
        createTime: mixOrder.createTime,
        packages: [{
            id: 'PKG_MIX',
            expressCompany: '中通快递',
            trackingNo: 'ZT' + Date.now(),
            status: 'delivered',
            shipTime: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            deliverTime: new Date(now.getTime() - 0.5 * 24 * 60 * 60 * 1000).toISOString(),
            items: [{ productId: 'P004', name: '法国香水', spec: '淡香/50ml', price: 299, qty: 1, img: '🌸' }]
        }]
    };
    DB.orders.push(mixOrder);
    DB.subOrders.push(mixSubOrder);
    results.push({ type: '混合支付(卡金+微信)', orderId: mixOrderId });
    
    saveData();
    console.log('支付方式测试数据已创建:', results);
    return results;
}

function resetData() {
    localStorage.removeItem('s2b2c_prototype_data');
    // 清除所有用户的数据
    Object.keys(TEST_USERS).forEach(userId => {
        localStorage.removeItem('s2b2c_user_' + userId);
    });
    location.reload();
}

// 清除订单数据（保留用户信息和购物车）
function clearOrderData() {
    DB.orders = [];
    DB.subOrders = [];
    DB.afterSales = [];
    DB.orderIdCounter = 1000;
    DB.subOrderIdCounter = 1;
    DB.afterSaleIdCounter = 1;
    saveData();
    return true;
}

/**
 * ==================== 场景化Mock数据生成系统 ====================
 * 生成有意义的测试数据，让用户能够操作完整的业务流程
 */

/**
 * 清空所有数据并重新生成场景化Mock数据
 */
function resetAndGenerateScenarioData() {
    console.log('🗑️ 清空所有数据...');
    
    // 清空内存数据
    DB.orders = [];
    DB.subOrders = [];
    DB.afterSales = [];
    DB.cart = [];
    DB.orderIdCounter = 1000;
    DB.subOrderIdCounter = 1;
    DB.afterSaleIdCounter = 1;
    
    // 清空localStorage
    localStorage.removeItem('s2b2c_prototype_data');
    Object.keys(TEST_USERS).forEach(userId => {
        localStorage.removeItem('s2b2c_user_' + userId);
    });
    
    console.log('✅ 数据已清空');
    console.log('🎬 开始生成场景化Mock数据...');
    
    // 生成场景化订单数据
    generateScenarioOrders();
    
    // 生成场景化售后数据
    generateScenarioAfterSales();
    
    // 保存数据
    saveData();
    saveAllUserData();
    
    console.log('✅ 场景化Mock数据生成完成！');
    console.log(`📦 订单数: ${DB.orders.length}`);
    console.log(`📋 子订单数: ${DB.subOrders.length}`);
    console.log(`🔄 售后单数: ${DB.afterSales.length}`);
    
    return {
        orders: DB.orders.length,
        subOrders: DB.subOrders.length,
        afterSales: DB.afterSales.length
    };
}

/**
 * 生成场景化订单数据
 * 每种状态都有可操作的订单
 */
function generateScenarioOrders() {
    const now = new Date();
    const scenarios = [
        // ========== 待发货订单（可以去发货） ==========
        {
            name: '待发货订单1 - 北京店张三',
            userId: 'U001',
            storeId: 'STORE001',
            status: 'paid',
            subOrderStatus: 'pending_ship',
            daysAgo: 1,
            products: [{ id: 'P001', qty: 2 }],
            paymentType: 'cash_only'
        },
        {
            name: '待发货订单2 - 上海店李四',
            userId: 'U003',
            storeId: 'STORE002',
            status: 'paid',
            subOrderStatus: 'pending_ship',
            daysAgo: 2,
            products: [{ id: 'P002', qty: 1 }, { id: 'P003', qty: 1 }],
            paymentType: 'mixed'
        },
        {
            name: '待发货订单3 - 广州店陈七',
            userId: 'U005',
            storeId: 'STORE003',
            status: 'paid',
            subOrderStatus: 'pending_ship',
            daysAgo: 0,
            products: [{ id: 'P004', qty: 1 }],
            paymentType: 'points_cash'
        },
        
        // ========== 部分发货订单（可以追加发货） ==========
        {
            name: '部分发货订单 - 北京店王五',
            userId: 'U002',
            storeId: 'STORE001',
            status: 'partial_shipped',
            subOrderStatus: 'partial_shipped',
            daysAgo: 3,
            products: [{ id: 'P001', qty: 3 }, { id: 'P005', qty: 2 }],
            paymentType: 'cash_only',
            partialShip: true  // 标记为部分发货
        },
        
        // ========== 已发货订单（可以确认收货） ==========
        {
            name: '已发货订单1 - 上海店赵六',
            userId: 'U004',
            storeId: 'STORE002',
            status: 'shipped',
            subOrderStatus: 'shipped',
            daysAgo: 5,
            products: [{ id: 'P002', qty: 2 }],
            paymentType: 'cash_only',
            shipped: true
        },
        {
            name: '已发货订单2 - 广州店周八',
            userId: 'U006',
            storeId: 'STORE003',
            status: 'shipped',
            subOrderStatus: 'shipped',
            daysAgo: 4,
            products: [{ id: 'P003', qty: 1 }],
            paymentType: 'card_only',
            shipped: true
        },
        
        // ========== 已完成订单（可以申请售后） ==========
        {
            name: '已完成订单1 - 北京店张三',
            userId: 'U001',
            storeId: 'STORE001',
            status: 'completed',
            subOrderStatus: 'delivered',
            daysAgo: 10,
            products: [{ id: 'P004', qty: 1 }],
            paymentType: 'cash_only',
            completed: true
        },
        {
            name: '已完成订单2 - 上海店李四',
            userId: 'U003',
            storeId: 'STORE002',
            status: 'completed',
            subOrderStatus: 'delivered',
            daysAgo: 8,
            products: [{ id: 'P005', qty: 1 }],
            paymentType: 'mixed',
            completed: true
        },
        {
            name: '已完成订单3 - 广州店陈七',
            userId: 'U005',
            storeId: 'STORE003',
            status: 'completed',
            subOrderStatus: 'delivered',
            daysAgo: 7,
            products: [{ id: 'P001', qty: 1 }, { id: 'P002', qty: 1 }],
            paymentType: 'cash_only',
            completed: true
        }
    ];
    
    scenarios.forEach((scenario, index) => {
        createScenarioOrder(scenario, index);
    });
}

/**
 * 创建单个场景订单
 */
function createScenarioOrder(scenario, index) {
    const now = new Date();
    const orderTime = new Date(now.getTime() - scenario.daysAgo * 24 * 3600000);
    
    const user = TEST_USERS[scenario.userId];
    const store = TEST_STORES[scenario.storeId];
    
    if (!user || !store) {
        console.warn(`用户或门店不存在: ${scenario.userId}, ${scenario.storeId}`);
        return;
    }
    
    // 获取商品信息
    const orderItems = [];
    let totalAmount = 0;
    
    scenario.products.forEach(p => {
        const product = DB.products.find(prod => prod.id === p.id);
        if (product) {
            orderItems.push({
                productId: product.id,
                name: product.name,
                spec: product.spec,
                price: product.price,
                supplyPrice: product.supplyPrice || product.price * 0.7,
                qty: p.qty,
                img: product.img,
                supplierId: product.supplierId
            });
            totalAmount += product.price * p.qty;
        }
    });
    
    if (orderItems.length === 0) {
        console.warn(`没有有效商品: ${scenario.name}`);
        return;
    }
    
    // 计算支付金额
    const paymentInfo = calculatePaymentInfo(totalAmount, scenario.paymentType);
    
    // 生成订单ID
    const orderId = `ORD${String(DB.orderIdCounter++).padStart(8, '0')}`;
    
    // 按供应商分组创建子订单
    const supplierGroups = {};
    orderItems.forEach(item => {
        const supplierId = item.supplierId || 'SELF';
        if (!supplierGroups[supplierId]) {
            supplierGroups[supplierId] = [];
        }
        supplierGroups[supplierId].push(item);
    });
    
    const subOrders = [];
    const subOrderIds = [];
    
    Object.entries(supplierGroups).forEach(([supplierId, items], subIndex) => {
        const subOrderId = `${orderId}-${subIndex + 1}`;
        const subAmount = items.reduce((sum, item) => sum + item.price * item.qty, 0);
        const subSupplyAmount = items.reduce((sum, item) => sum + (item.supplyPrice || item.price * 0.7) * item.qty, 0);
        
        // 计算子订单的支付分摊
        const ratio = totalAmount > 0 ? subAmount / totalAmount : 1;
        
        const subOrder = {
            id: subOrderId,
            parentOrderId: orderId,
            supplierId: supplierId,
            supplierName: supplierId === 'SELF' ? '自营仓库' : (DB.suppliers.find(s => s.id === supplierId)?.name || '供应商'),
            status: scenario.subOrderStatus,
            items: items,
            amount: subAmount,
            supplyAmount: subSupplyAmount,
            freight: 0,
            pointsDeduct: Math.round(paymentInfo.pointsDeduct * ratio * 100) / 100,
            cardDeduct: Math.round(paymentInfo.cardDeduct * ratio * 100) / 100,
            cashPaid: Math.round(paymentInfo.cashPaid * ratio * 100) / 100,
            couponDeduct: 0,
            createTime: orderTime.toISOString(),
            packages: []
        };
        
        // 如果是部分发货，添加一个已发货的包裹
        if (scenario.partialShip && items.length > 1) {
            const firstItem = items[0];
            subOrder.packages.push({
                id: `PKG${Date.now()}${subIndex}`,
                expressCompany: '顺丰快递',
                trackingNo: `SF${Math.random().toString().substr(2, 12)}`,
                shipTime: new Date(orderTime.getTime() + 24 * 3600000).toISOString(),
                status: 'shipped',
                items: [{ ...firstItem, qty: 1 }],
                sourceItems: []
            });
        }
        
        // 如果是已发货，添加发货信息
        if (scenario.shipped || scenario.completed) {
            subOrder.shipTime = new Date(orderTime.getTime() + 24 * 3600000).toISOString();
            subOrder.expressCompany = '顺丰快递';
            subOrder.trackingNo = `SF${Math.random().toString().substr(2, 12)}`;
            
            if (!subOrder.packages || subOrder.packages.length === 0) {
                subOrder.packages = [{
                    id: `PKG${Date.now()}${subIndex}`,
                    expressCompany: '顺丰快递',
                    trackingNo: subOrder.trackingNo,
                    shipTime: subOrder.shipTime,
                    status: scenario.completed ? 'delivered' : 'shipped',
                    items: items.map(i => ({ ...i })),
                    sourceItems: []
                }];
            }
        }
        
        // 如果是已完成，添加签收时间
        if (scenario.completed) {
            subOrder.deliverTime = new Date(orderTime.getTime() + 72 * 3600000).toISOString();
        }
        
        // 生成清分数据
        generateSubOrderClearingData(subOrder, scenario.storeId);
        
        subOrders.push(subOrder);
        subOrderIds.push(subOrderId);
        DB.subOrders.push(subOrder);
    });
    
    // 创建主订单
    const order = {
        id: orderId,
        userId: scenario.userId,
        storeId: scenario.storeId,
        storeName: store.name,
        userName: user.name,
        merchantId: 'M001',
        type: 'supply',
        status: scenario.status,
        totalAmount: totalAmount,
        totalFreight: 0,
        pointsDeduct: paymentInfo.pointsDeduct,
        cardDeduct: paymentInfo.cardDeduct,
        cashPaid: paymentInfo.cashPaid,
        couponDeduct: 0,
        paymentType: scenario.paymentType,
        paymentLabel: getPaymentLabel(scenario.paymentType),
        address: user.addresses[0] || { name: user.name, phone: user.phone, province: '北京市', city: '北京市', district: '朝阳区', detail: '测试地址' },
        items: orderItems,
        subOrders: subOrders,
        subOrderIds: subOrderIds,
        createTime: orderTime.toISOString(),
        payTime: orderTime.toISOString(),
        updateTime: orderTime.toISOString()
    };
    
    // 添加发货和完成时间
    if (scenario.shipped || scenario.completed) {
        order.shipTime = new Date(orderTime.getTime() + 24 * 3600000).toISOString();
    }
    if (scenario.completed) {
        order.completeTime = new Date(orderTime.getTime() + 72 * 3600000).toISOString();
    }
    
    DB.orders.push(order);
    console.log(`✅ 创建订单: ${scenario.name} (${orderId})`);
}

/**
 * 计算支付信息
 */
function calculatePaymentInfo(totalAmount, paymentType) {
    const paymentTypes = {
        'cash_only': { cashRatio: 1, pointsRatio: 0, cardRatio: 0 },
        'points_only': { cashRatio: 0, pointsRatio: 1, cardRatio: 0 },
        'card_only': { cashRatio: 0, pointsRatio: 0, cardRatio: 1 },
        'points_cash': { cashRatio: 0.6, pointsRatio: 0.4, cardRatio: 0 },
        'points_card': { cashRatio: 0, pointsRatio: 0.5, cardRatio: 0.5 },
        'mixed': { cashRatio: 0.5, pointsRatio: 0.3, cardRatio: 0.2 }
    };
    
    const ratios = paymentTypes[paymentType] || paymentTypes['cash_only'];
    
    return {
        cashPaid: Math.round(totalAmount * ratios.cashRatio * 100) / 100,
        pointsDeduct: Math.round(totalAmount * ratios.pointsRatio * 100) / 100,
        cardDeduct: Math.round(totalAmount * ratios.cardRatio * 100) / 100
    };
}

/**
 * 获取支付方式标签
 */
function getPaymentLabel(paymentType) {
    const labels = {
        'cash_only': '全现金支付',
        'points_only': '全积分支付',
        'card_only': '全卡金支付',
        'points_cash': '积分+现金',
        'points_card': '积分+卡金',
        'mixed': '组合支付'
    };
    return labels[paymentType] || '现金支付';
}

/**
 * 生成场景化售后数据
 * 每种状态都有可操作的售后单
 */
function generateScenarioAfterSales() {
    // 找到已完成的订单用于生成售后
    const completedOrders = DB.orders.filter(o => o.status === 'completed' || o.status === 'shipped');
    
    if (completedOrders.length === 0) {
        console.warn('没有可用于生成售后的订单');
        return;
    }
    
    const now = new Date();
    
    const afterSaleScenarios = [
        // ========== 待审核售后（可以审核通过/拒绝） ==========
        {
            name: '待审核-仅退款',
            type: 'refund_only',
            status: 'pending',
            reason: 'quality_issue',
            description: '商品有质量问题，申请退款',
            daysAgo: 1
        },
        {
            name: '待审核-退货退款',
            type: 'return_refund',
            status: 'pending',
            reason: 'not_as_described',
            description: '商品与描述不符，申请退货退款',
            daysAgo: 0
        },
        {
            name: '待审核-换货',
            type: 'exchange',
            status: 'pending',
            reason: 'damaged',
            description: '收到商品破损，申请换货',
            daysAgo: 2
        },
        
        // ========== 待寄回售后（等待用户寄回） ==========
        {
            name: '待寄回-退货退款',
            type: 'return_refund',
            status: 'waiting_return',
            reason: 'wrong_item',
            description: '发错货了，等待寄回',
            daysAgo: 3,
            returnAddress: '北京市朝阳区建国路88号退货仓库'
        },
        
        // ========== 退货中售后（可以确认收货） ==========
        {
            name: '退货中-退货退款',
            type: 'return_refund',
            status: 'returning',
            reason: 'quality_issue',
            description: '用户已寄回，等待仓库收货',
            daysAgo: 4,
            expressCompany: 'SF',
            trackingNo: 'SF1234567890',
            returnAddress: '北京市朝阳区建国路88号退货仓库'
        },
        {
            name: '退货中-换货',
            type: 'exchange',
            status: 'returning',
            reason: 'damaged',
            description: '换货商品已寄回，等待收货',
            daysAgo: 5,
            expressCompany: 'YTO',
            trackingNo: 'YT9876543210',
            returnAddress: '上海市浦东新区陆家嘴环路1000号退货仓库'
        },
        
        // ========== 已收货售后（可以退款/换货发货） ==========
        {
            name: '已收货-退货退款',
            type: 'return_refund',
            status: 'received',
            reason: 'not_as_described',
            description: '仓库已收货，待确认退款',
            daysAgo: 6
        },
        {
            name: '已收货-换货',
            type: 'exchange',
            status: 'received',
            reason: 'wrong_item',
            description: '仓库已收货，待换货发货',
            daysAgo: 7
        },
        
        // ========== 换货发货中（可以查看物流和确认收货） ==========
        {
            name: '换货发货中',
            type: 'exchange',
            status: 'reshipping',
            reason: 'size_color_wrong',
            description: '换货商品已发出，请注意查收',
            daysAgo: 8,
            exchangeExpressCompany: '顺丰快递',
            exchangeTrackingNo: 'SF202601170001'
        },
        
        // ========== 已完成售后（历史记录） ==========
        {
            name: '已完成-仅退款',
            type: 'refund_only',
            status: 'completed',
            reason: 'no_longer_needed',
            description: '退款已完成',
            daysAgo: 15
        },
        {
            name: '已完成-换货',
            type: 'exchange',
            status: 'completed',
            reason: 'damaged',
            description: '换货已完成',
            daysAgo: 12,
            exchangeExpressCompany: '中通快递',
            exchangeTrackingNo: 'ZTO202601050001'
        },
        
        // ========== 已拒绝售后（历史记录） ==========
        {
            name: '已拒绝-退货退款',
            type: 'return_refund',
            status: 'rejected',
            reason: 'no_longer_needed',
            description: '超过售后时效，已拒绝',
            daysAgo: 20,
            rejectReason: '超过15天售后申请时效'
        }
    ];
    
    afterSaleScenarios.forEach((scenario, index) => {
        const orderIndex = index % completedOrders.length;
        const order = completedOrders[orderIndex];
        
        createScenarioAfterSale(scenario, order, index);
    });
}

/**
 * 创建单个场景售后单
 */
function createScenarioAfterSale(scenario, order, index) {
    const now = new Date();
    const createTime = new Date(now.getTime() - scenario.daysAgo * 24 * 3600000);
    
    // 选择订单中的第一个商品
    const item = order.items[0];
    if (!item) {
        console.warn(`订单没有商品: ${order.id}`);
        return;
    }
    
    const refundQty = 1;
    const refundAmount = scenario.type === 'exchange' ? 0 : item.price * refundQty;
    
    // 将原因代码转换为文本
    const reasonMap = {
        'quality_issue': '商品质量问题',
        'not_as_described': '商品与描述不符',
        'damaged': '收到商品破损',
        'wrong_item': '发错货/漏发',
        'no_longer_needed': '不想要了',
        'size_color_wrong': '尺码/颜色选错',
        'other': '其他原因'
    };
    const reasonText = reasonMap[scenario.reason] || scenario.reason;
    
    // 判断运费责任方
    const supplierReasons = ['商品质量问题', '商品与描述不符', '收到商品破损', '发错货/漏发'];
    const reasonType = supplierReasons.includes(reasonText) ? 'supplier' : 'buyer';
    const freightResponsibility = reasonType;
    
    const afterSale = {
        id: 'AS' + String(DB.afterSaleIdCounter++).padStart(6, '0'),
        orderId: order.id,
        subOrderId: order.subOrderIds ? order.subOrderIds[0] : null,
        userId: order.userId,
        storeId: order.storeId,
        type: scenario.type,
        status: scenario.status,
        reason: reasonText,
        reasonType: reasonType,
        freightResponsibility: freightResponsibility,
        description: scenario.description,
        items: [{
            productId: item.productId,
            name: item.name,
            spec: item.spec,
            price: item.price,
            qty: refundQty,
            img: item.img
        }],
        itemsAmount: item.price * refundQty,
        discountAmount: Math.round(item.price * refundQty * 0.1 * 100) / 100,
        refundAmount: refundAmount,
        refundCashAmount: Math.round(refundAmount * 0.7 * 100) / 100,
        refundPointsAmount: Math.round(refundAmount * 0.2 * 100) / 100,
        refundCardAmount: Math.round(refundAmount * 0.1 * 100) / 100,
        createTime: createTime.toISOString(),
        updateTime: new Date(createTime.getTime() + 3600000).toISOString()
    };
    
    // 添加退货地址
    if (scenario.returnAddress) {
        afterSale.returnAddress = scenario.returnAddress;
    }
    
    // 添加退货物流信息
    if (scenario.expressCompany) {
        afterSale.returnExpressCompany = scenario.expressCompany;
        afterSale.returnTrackingNo = scenario.trackingNo;
        afterSale.returnTime = new Date(createTime.getTime() + 24 * 3600000).toISOString();
    }
    
    // 添加换货物流信息
    if (scenario.exchangeExpressCompany) {
        afterSale.exchangeExpressCompany = scenario.exchangeExpressCompany;
        afterSale.exchangeTrackingNo = scenario.exchangeTrackingNo;
        afterSale.exchangeShipTime = new Date(createTime.getTime() + 36 * 3600000).toISOString();
    }
    
    // 添加拒绝原因
    if (scenario.rejectReason) {
        afterSale.rejectReason = scenario.rejectReason;
        afterSale.reviewTime = new Date(createTime.getTime() + 3600000).toISOString();
    }
    
    // 如果是已完成状态，添加完成时间
    if (scenario.status === 'completed') {
        afterSale.completeTime = new Date(createTime.getTime() + 48 * 3600000).toISOString();
        afterSale.refundTime = afterSale.completeTime;
        // 换货完成时添加收货时间
        if (scenario.type === 'exchange') {
            afterSale.exchangeReceiveTime = afterSale.completeTime;
        }
    }
    
    DB.afterSales.push(afterSale);
    console.log(`✅ 创建售后: ${scenario.name} (${afterSale.id})`);
}

/**
 * 保存所有用户的数据
 */
function saveAllUserData() {
    Object.keys(TEST_USERS).forEach(userId => {
        const userOrders = DB.orders.filter(o => o.userId === userId);
        const userSubOrders = DB.subOrders.filter(so => {
            const order = DB.orders.find(o => o.id === so.parentOrderId);
            return order && order.userId === userId;
        });
        const userAfterSales = DB.afterSales.filter(as => as.userId === userId);
        
        const userData = {
            cart: [],
            orders: userOrders,
            subOrders: userSubOrders,
            afterSales: userAfterSales
        };
        
        localStorage.setItem('s2b2c_user_' + userId, JSON.stringify(userData));
    });
}

// 切换门店
function switchStore(storeId) {
    if (!TEST_STORES[storeId]) {
        console.error('门店不存在:', storeId);
        return false;
    }
    currentStoreId = storeId;
    DB.currentStore = JSON.parse(JSON.stringify(TEST_STORES[storeId]));
    
    // 找到该门店的第一个用户并切换
    const storeUsers = Object.values(TEST_USERS).filter(u => u.storeId === storeId);
    if (storeUsers.length > 0) {
        switchUser(storeUsers[0].id);
    }
    
    saveData();
    return true;
}

// 获取所有门店列表
function getStores() {
    return Object.values(TEST_STORES).map(s => ({
        id: s.id,
        name: s.name,
        code: s.code,
        brandName: s.brandName || s.name,  // 品牌名称，单店则用门店名
        isChain: s.isChain || false,       // 是否连锁店
        userCount: Object.values(TEST_USERS).filter(u => u.storeId === s.id).length
    }));
}

// 获取指定门店的用户列表
function getStoreUsers(storeId) {
    return Object.values(TEST_USERS)
        .filter(u => u.storeId === storeId)
        .map(u => ({
            id: u.id,
            name: u.name,
            phone: u.phone,
            storeId: u.storeId,
            cardCount: u.memberCards.length,
            points: u.points
        }));
}

// 切换测试账号
function switchUser(userId) {
    if (!TEST_USERS[userId]) {
        console.error('用户不存在:', userId);
        return false;
    }
    
    // 保存当前用户的数据
    saveUserData(currentUserId);
    
    currentUserId = userId;
    // 深拷贝用户数据
    DB.user = JSON.parse(JSON.stringify(TEST_USERS[userId]));
    
    // 同步更新当前门店
    const userStoreId = TEST_USERS[userId].storeId;
    if (userStoreId && TEST_STORES[userStoreId]) {
        currentStoreId = userStoreId;
        DB.currentStore = JSON.parse(JSON.stringify(TEST_STORES[userStoreId]));
    }
    
    // 加载新用户的数据
    loadUserData(userId);
    
    return true;
}

// 获取所有测试账号列表
function getTestUsers() {
    return Object.values(TEST_USERS).map(u => ({
        id: u.id,
        name: u.name,
        storeId: u.storeId,
        storeName: TEST_STORES[u.storeId] ? TEST_STORES[u.storeId].name : '',
        cardCount: u.memberCards.length,
        points: u.points
    }));
}

// 格式化时间
function formatTime(isoString) {
    if (!isoString) return '-';
    const date = new Date(isoString);
    return date.getFullYear() + '-' + 
        (date.getMonth() + 1).toString().padStart(2, '0') + '-' +
        date.getDate().toString().padStart(2, '0') + ' ' +
        date.getHours().toString().padStart(2, '0') + ':' +
        date.getMinutes().toString().padStart(2, '0');
}

// 订单状态文本
function getOrderStatusText(status) {
    const map = {
        'pending_pay': '待付款',
        'paid': '待发货',
        'partial_shipped': '部分发货',
        'shipped': '已发货',
        'completed': '已完成',
        'cancelled': '交易取消',
        'refunded': '已退款'
    };
    return map[status] || status;
}

// 子订单状态文本
function getSubOrderStatusText(status) {
    const map = {
        'pending_ship': '待发货',
        'partial_shipped': '部分发货',
        'shipped': '已发货',
        'delivered': '已签收',
        'refunded': '已退款'
    };
    return map[status] || status;
}

// 售后状态文本
function getAfterSaleStatusText(status) {
    const map = {
        'pending': '待审核',
        'approved': '已通过',
        'waiting_return': '待寄回',
        'returning': '退货中',
        'received': '已收货',
        'reshipping': '换货发货中',
        'rejected': '已拒绝',
        'processing': '处理中',
        'completed': '已完成'
    };
    return map[status] || status;
}

// 售后类型文本
function getAfterSaleTypeText(type) {
    const map = {
        'refund_only': '仅退款',
        'return_refund': '退货退款',
        'exchange': '换货'
    };
    return map[type] || type;
}

// 获取运费原因文本（根据运费快照）
function getFreightReasonText(freightSnapshot) {
    if (!freightSnapshot) return '';
    
    // 如果是包邮
    if (freightSnapshot.isFreeShipping) {
        return '已享包邮';
    }
    
    // 检查是否为偏远地区
    const province = freightSnapshot.province;
    if (province) {
        // 检查是否在平台偏远地区列表中
        const isRemote = PLATFORM_REMOTE_AREAS.some(ra => ra.province === province);
        if (isRemote) {
            return `${province.replace('维吾尔自治区', '').replace('回族自治区', '').replace('自治区', '').replace('省', '')}地区运费`;
        }
    }
    
    return '';
}

// ==================== 运费计算相关函数 ====================

// ========== V2.0 运费模板函数（按商品配置）==========

/**
 * 获取运费模板（V2.0）
 * @param {string} templateId - 运费模板ID
 * @returns {object|null} 运费模板
 */
function getFreightTemplateV2(templateId) {
    if (!templateId) return null;
    return (DB.freightTemplatesV2 || FREIGHT_TEMPLATES_V2).find(t => t.id === templateId) || null;
}

/**
 * 获取不可发货地区模板
 * @param {string} templateId - 模板ID
 * @returns {object|null} 不可发货地区模板
 */
function getNoDeliveryTemplate(templateId) {
    if (!templateId) return null;
    return (DB.noDeliveryTemplates || NO_DELIVERY_TEMPLATES).find(t => t.id === templateId) || null;
}

/**
 * 获取默认运费模板
 * @returns {object} 默认运费模板
 */
function getDefaultFreightTemplate() {
    return (DB.freightTemplatesV2 || FREIGHT_TEMPLATES_V2).find(t => t.isDefault) || FREIGHT_TEMPLATES_V2[0];
}

/**
 * 获取默认不可发货地区模板
 * @returns {object} 默认不可发货地区模板
 */
function getDefaultNoDeliveryTemplate() {
    return (DB.noDeliveryTemplates || NO_DELIVERY_TEMPLATES).find(t => t.isDefault) || NO_DELIVERY_TEMPLATES[0];
}

/**
 * 检查商品是否可配送到指定地区（V2.0）
 * @param {object} product - 商品对象
 * @param {string} province - 省份
 * @returns {object} { canDeliver: boolean, message: string }
 */
function checkProductDeliveryV2(product, province) {
    if (!product || !province) {
        return { canDeliver: true, message: '' };
    }
    
    // 获取商品的不可发货地区模板
    const templateId = product.noDeliveryTemplateId;
    const template = templateId ? getNoDeliveryTemplate(templateId) : getDefaultNoDeliveryTemplate();
    
    if (!template) {
        return { canDeliver: true, message: '' };
    }
    
    // 检查是否在不可发货地区
    if (template.areas && template.areas.includes(province)) {
        return { 
            canDeliver: false, 
            message: `「${product.name}」暂不支持配送到${province}` 
        };
    }
    
    return { canDeliver: true, message: '' };
}

/**
 * 计算单个商品的运费（V2.0）
 * @param {object} product - 商品对象
 * @param {string} province - 收货省份
 * @returns {object} { freight, isFreeShipping, reason }
 */
function calculateProductFreightV2(product, province) {
    if (!product) {
        return { freight: 0, isFreeShipping: true, reason: '包邮' };
    }
    
    // 获取商品的运费模板
    const templateId = product.freightTemplateId;
    const template = templateId ? getFreightTemplateV2(templateId) : getDefaultFreightTemplate();
    
    if (!template) {
        return { freight: 0, isFreeShipping: true, reason: '包邮' };
    }
    
    // 计算基础运费
    let freight = template.baseFreight || 0;
    let reason = freight > 0 ? `基础运费¥${freight}` : '包邮';
    
    // 检查是否为偏远地区
    const remoteArea = (template.remoteAreas || []).find(ra => ra.province === province);
    if (remoteArea) {
        freight = remoteArea.freight;
        reason = `${province}地区运费¥${freight}`;
    }
    
    return {
        freight: freight,
        isFreeShipping: freight === 0,
        reason: reason,
        templateId: template.id,
        templateName: template.name
    };
}

/**
 * 计算订单运费（V2.0 - 按商品SKU累加邮费）
 * @param {string} province - 收货省份
 * @param {array} items - 商品列表 [{ productId, qty, product }]
 * @returns {object} { totalFreight, productFreights, canDeliver, deliveryErrors, supplierFreights }
 */
function calculateOrderFreightV2(province, items) {
    const productFreights = [];
    const supplierFreights = [];
    const deliveryErrors = [];
    
    // 按供应商分组
    const supplierGroups = {};
    items.forEach(item => {
        if (!item.product || item.product.type !== 'supply') return;
        
        // 检查是否可配送
        const deliveryCheck = checkProductDeliveryV2(item.product, province);
        if (!deliveryCheck.canDeliver) {
            deliveryErrors.push({
                productId: item.product.id,
                productName: item.product.name,
                message: deliveryCheck.message
            });
            return;
        }
        
        const supplierId = item.product.supplierId || 'unknown';
        if (!supplierGroups[supplierId]) {
            supplierGroups[supplierId] = [];
        }
        supplierGroups[supplierId].push(item);
        
        // 计算该商品的运费（按数量累加）
        const freightResult = calculateProductFreightV2(item.product, province);
        const totalProductFreight = freightResult.freight * item.qty; // 按数量累加
        
        productFreights.push({
            productId: item.product.id,
            productName: item.product.name,
            supplierId: supplierId,
            qty: item.qty,
            unitFreight: freightResult.freight,
            totalFreight: totalProductFreight,
            isFreeShipping: freightResult.isFreeShipping,
            reason: freightResult.reason,
            templateId: freightResult.templateId,
            templateName: freightResult.templateName
        });
    });
    
    // 按供应商汇总运费（累加该供应商所有商品的运费）
    let totalFreight = 0;
    Object.keys(supplierGroups).forEach(supplierId => {
        const supplierItems = supplierGroups[supplierId];
        let supplierTotalFreight = 0;
        
        // 累加该供应商所有商品的运费
        supplierItems.forEach(item => {
            const pf = productFreights.find(f => f.productId === item.product.id);
            if (pf) {
                supplierTotalFreight += pf.totalFreight;
            }
        });
        
        const supplier = (DB.suppliers || []).find(s => s.id === supplierId);
        supplierFreights.push({
            supplierId: supplierId,
            supplierName: supplier ? supplier.name : '未知供应商',
            freight: supplierTotalFreight,
            isFreeShipping: supplierTotalFreight === 0,
            itemCount: supplierItems.reduce((sum, item) => sum + item.qty, 0)
        });
        
        totalFreight += supplierTotalFreight;
    });
    
    return {
        totalFreight: totalFreight,
        productFreights: productFreights,
        supplierFreights: supplierFreights,
        canDeliver: deliveryErrors.length === 0,
        deliveryErrors: deliveryErrors,
        freightRule: '按商品SKU累加（商品A运费×数量A + 商品B运费×数量B）'
    };
}

/**
 * 获取所有运费模板列表（V2.0）
 * @returns {array} 运费模板列表
 */
function getFreightTemplateListV2() {
    return DB.freightTemplatesV2 || FREIGHT_TEMPLATES_V2;
}

/**
 * 获取所有不可发货地区模板列表
 * @returns {array} 不可发货地区模板列表
 */
function getNoDeliveryTemplateList() {
    return DB.noDeliveryTemplates || NO_DELIVERY_TEMPLATES;
}

// ========== 旧版运费函数（保留兼容）==========

/**
 * 获取供应商的运费模板（旧版，保留兼容）
 * @param {string} supplierId - 供应商ID
 * @returns {object|null} 运费模板
 */
function getFreightTemplate(supplierId) {
    if (!supplierId) return null;
    return DB.freightTemplates[supplierId] || null;
}

/**
 * 检查地址是否可配送（旧版，保留兼容）
 * @param {string} supplierId - 供应商ID
 * @param {string} province - 省份
 * @returns {object} { canDeliver: boolean, message: string }
 */
function checkDeliveryAvailable(supplierId, province) {
    const template = getFreightTemplate(supplierId);
    
    // 没有模板，默认可配送
    if (!template || !template.enabled) {
        return { canDeliver: true, message: '' };
    }
    
    // 检查不发货地区
    const noDeliveryAreas = template.noDeliveryAreas || DEFAULT_NO_DELIVERY_AREAS;
    if (noDeliveryAreas.includes(province)) {
        const supplier = DB.suppliers.find(s => s.id === supplierId);
        return { 
            canDeliver: false, 
            message: `${supplier ? supplier.name : '该供应商'}暂不支持配送到${province}` 
        };
    }
    
    return { canDeliver: true, message: '' };
}

/**
 * 计算单个供应商的运费（旧版，保留兼容）
 * @param {string} supplierId - 供应商ID
 * @param {string} province - 收货省份
 * @param {number} orderAmount - 该供应商商品金额
 * @returns {object} { freight, isFreeShipping, reason }
 */
function calculateSupplierFreight(supplierId, province, orderAmount) {
    const template = getFreightTemplate(supplierId);
    
    // 没有模板或未启用，默认包邮
    if (!template || !template.enabled) {
        return {
            freight: 0,
            isFreeShipping: true,
            reason: '包邮'
        };
    }
    
    // 计算基础运费或偏远地区运费
    let freight = template.baseFreight || 0;
    let reason = freight > 0 ? `基础运费¥${freight}` : '包邮';
    
    // 检查是否为偏远地区
    const remoteArea = (template.remoteAreas || []).find(ra => ra.province === province);
    if (remoteArea) {
        freight = remoteArea.freight;
        reason = `${province}地区运费¥${freight}`;
    }
    
    return {
        freight: freight,
        isFreeShipping: freight === 0,
        reason: reason
    };
}

/**
 * 计算订单运费（旧版按供应商维度，保留兼容）
 * @param {string} province - 收货省份
 * @param {array} items - 商品列表 [{ productId, qty, product }]
 * @returns {object} { totalFreight, supplierFreights, canDeliver, deliveryErrors }
 */
function calculateOrderFreight(province, items) {
    // 按供应商分组
    const supplierGroups = {};
    items.forEach(item => {
        if (!item.product || item.product.type !== 'supply') return;
        
        const supplierId = item.product.supplierId;
        if (!supplierGroups[supplierId]) {
            supplierGroups[supplierId] = {
                supplierId: supplierId,
                items: [],
                totalAmount: 0
            };
        }
        supplierGroups[supplierId].items.push(item);
        supplierGroups[supplierId].totalAmount += item.product.price * item.qty;
    });
    
    const supplierFreights = [];
    const deliveryErrors = [];
    let totalFreight = 0;
    let supplierIndex = 1;
    
    Object.values(supplierGroups).forEach(group => {
        // 检查是否可配送
        const deliveryCheck = checkDeliveryAvailable(group.supplierId, province);
        if (!deliveryCheck.canDeliver) {
            deliveryErrors.push({
                supplierId: group.supplierId,
                message: deliveryCheck.message
            });
            return;
        }
        
        // 计算运费
        const freightResult = calculateSupplierFreight(group.supplierId, province, group.totalAmount);
        const supplier = DB.suppliers.find(s => s.id === group.supplierId);
        
        supplierFreights.push({
            supplierId: group.supplierId,
            supplierDisplayName: `供应商${supplierIndex}`,
            supplierName: supplier ? supplier.name : '未知供应商',
            orderAmount: group.totalAmount,
            freight: freightResult.freight,
            isFreeShipping: freightResult.isFreeShipping,
            freeShippingGap: freightResult.freeShippingGap,
            reason: freightResult.reason
        });
        
        totalFreight += freightResult.freight;
        supplierIndex++;
    });
    
    return {
        totalFreight: totalFreight,
        supplierFreights: supplierFreights,
        canDeliver: deliveryErrors.length === 0,
        deliveryErrors: deliveryErrors
    };
}

/**
 * 生成运费快照
 * @param {string} subOrderId - 子订单ID
 * @param {string} supplierId - 供应商ID
 * @param {string} province - 收货省份
 * @param {number} orderAmount - 商品金额
 * @param {number} freight - 运费金额
 * @returns {object} 运费快照
 */
function createFreightSnapshot(subOrderId, supplierId, province, orderAmount, freight) {
    const template = getFreightTemplate(supplierId);
    return {
        subOrderId: subOrderId,
        supplierId: supplierId,
        province: province,
        orderAmount: orderAmount,
        freight: freight,
        isFreeShipping: freight === 0,
        templateVersion: template ? template.version : 0,
        snapshotTime: new Date().toISOString()
    };
}

/**
 * 更新运费模板
 * @param {string} supplierId - 供应商ID
 * @param {object} updates - 更新内容
 * @param {string} operatorId - 操作人ID
 * @returns {object} { success, template }
 */
function updateFreightTemplate(supplierId, updates, operatorId = 'admin') {
    let template = DB.freightTemplates[supplierId];
    const oldValue = template ? JSON.parse(JSON.stringify(template)) : null;
    
    if (!template) {
        // 创建新模板
        template = {
            supplierId: supplierId,
            baseFreight: 0,
            remoteAreas: [],
            noDeliveryAreas: [...DEFAULT_NO_DELIVERY_AREAS],
            enabled: true,
            version: 1
        };
    }
    
    // 应用更新
    Object.assign(template, updates);
    template.version = (template.version || 0) + 1;
    
    DB.freightTemplates[supplierId] = template;
    
    // 记录变更日志
    DB.freightTemplateLogs.push({
        templateId: supplierId,
        supplierId: supplierId,
        changeType: oldValue ? 'UPDATE' : 'CREATE',
        oldValue: oldValue,
        newValue: JSON.parse(JSON.stringify(template)),
        operatorId: operatorId,
        createTime: new Date().toISOString()
    });
    
    saveData();
    
    return { success: true, template: template };
}

/**
 * 获取所有运费模板列表
 * @returns {array} 运费模板列表
 */
function getFreightTemplateList() {
    return Object.values(DB.freightTemplates).map(template => {
        const supplier = DB.suppliers.find(s => s.id === template.supplierId);
        return {
            ...template,
            supplierName: supplier ? supplier.name : '未知供应商'
        };
    });
}

// 初始化加载数据
loadData();

// ==================== 售后退款金额计算函数 ====================

/**
 * 计算退款金额（支持优惠分摊）
 * 退款金额 = 商品金额 - 优惠分摊
 * 优惠分摊 = (商品金额 / 订单总金额) * 订单优惠金额
 * 
 * @param {object} subOrder - 子订单对象
 * @param {array} refundItems - 退款商品列表 [{ productId, qty }]
 * @returns {object} { itemsAmount, discountAmount, refundAmount }
 */
function calculateRefundAmount(subOrder, refundItems) {
    if (!subOrder || !refundItems || refundItems.length === 0) {
        return { itemsAmount: 0, discountAmount: 0, refundAmount: 0 };
    }
    
    // 计算退款商品原价总额
    const itemsAmount = refundItems.reduce((sum, item) => {
        const orderItem = subOrder.items.find(oi => oi.productId === item.productId);
        if (!orderItem) return sum;
        return sum + orderItem.price * item.qty;
    }, 0);
    
    // 计算子订单商品总额
    const subOrderTotal = subOrder.items.reduce((sum, item) => sum + item.price * item.qty, 0);
    
    // 计算子订单总优惠金额（优惠券）
    const totalDiscount = (subOrder.couponDeduct || 0);
    
    // 按比例计算优惠分摊
    const ratio = subOrderTotal > 0 ? itemsAmount / subOrderTotal : 0;
    const discountAmount = Math.round(totalDiscount * ratio * 100) / 100;
    
    // 退款金额 = 商品金额 - 优惠分摊
    const refundAmount = Math.round((itemsAmount - discountAmount) * 100) / 100;
    
    return {
        itemsAmount: Math.round(itemsAmount * 100) / 100,
        discountAmount: discountAmount,
        refundAmount: Math.max(0, refundAmount)  // 确保不为负数
    };
}

/**
 * 计算退款明细（积分/卡金/现金退回）
 * 按原支付方式比例分摊退款金额
 * 
 * @param {object} subOrder - 子订单对象
 * @param {number} refundAmount - 应退总金额
 * @param {number} itemsAmount - 退款商品原价总额
 * @returns {object} { refundPointsAmount, refundCardAmount, refundCashAmount, total }
 */
function calculateRefundDetail(subOrder, refundAmount, itemsAmount) {
    if (!subOrder || refundAmount <= 0) {
        return {
            refundPointsAmount: 0,
            refundCardAmount: 0,
            refundCashAmount: 0,
            total: 0
        };
    }
    
    // 计算子订单商品总额
    const subOrderTotal = subOrder.items.reduce((sum, item) => sum + item.price * item.qty, 0);
    
    // 计算退款商品占子订单的比例
    const ratio = subOrderTotal > 0 ? itemsAmount / subOrderTotal : 1;
    
    // 获取子订单的各支付方式金额
    const pointsDeduct = subOrder.pointsDeduct || 0;
    const cardDeduct = subOrder.cardDeduct || 0;
    const cashPaid = subOrder.cashPaid || 0;
    
    // 按比例计算各支付方式的退款金额
    let refundPointsAmount = Math.round(pointsDeduct * ratio * 100) / 100;
    let refundCardAmount = Math.round(cardDeduct * ratio * 100) / 100;
    let refundCashAmount = Math.round(cashPaid * ratio * 100) / 100;
    
    // 计算总和（使用精确计算避免浮点误差）
    let total = Math.round((refundPointsAmount + refundCardAmount + refundCashAmount) * 100) / 100;
    
    // 处理精度误差：调整最大的非零部分使总和等于refundAmount
    const diff = Math.round((refundAmount - total) * 100) / 100;
    if (Math.abs(diff) > 0) {
        // 找到最大的非零部分进行调整
        if (refundCashAmount > 0 || (refundPointsAmount === 0 && refundCardAmount === 0)) {
            refundCashAmount = Math.round((refundCashAmount + diff) * 100) / 100;
        } else if (refundCardAmount >= refundPointsAmount) {
            refundCardAmount = Math.round((refundCardAmount + diff) * 100) / 100;
        } else {
            refundPointsAmount = Math.round((refundPointsAmount + diff) * 100) / 100;
        }
        // 重新计算总和
        total = Math.round((refundPointsAmount + refundCardAmount + refundCashAmount) * 100) / 100;
    }
    
    return {
        refundPointsAmount: Math.max(0, refundPointsAmount),
        refundCardAmount: Math.max(0, refundCardAmount),
        refundCashAmount: Math.max(0, refundCashAmount),
        total: total
    };
}

/**
 * 计算完整的退款信息（组合函数）
 * 
 * @param {object} subOrder - 子订单对象
 * @param {array} refundItems - 退款商品列表 [{ productId, qty }]
 * @returns {object} 完整的退款信息
 */
function calculateFullRefundInfo(subOrder, refundItems) {
    // 计算退款金额
    const amountInfo = calculateRefundAmount(subOrder, refundItems);
    
    // 计算退款明细
    const detailInfo = calculateRefundDetail(subOrder, amountInfo.refundAmount, amountInfo.itemsAmount);
    
    return {
        // 金额信息
        itemsAmount: amountInfo.itemsAmount,
        discountAmount: amountInfo.discountAmount,
        refundAmount: amountInfo.refundAmount,
        // 退款明细
        refundPointsAmount: detailInfo.refundPointsAmount,
        refundCardAmount: detailInfo.refundCardAmount,
        refundCashAmount: detailInfo.refundCashAmount,
        // 积分换算（100积分=1元）
        refundPoints: Math.round(detailInfo.refundPointsAmount * 100)
    };
}

// ==================== 售后申请入口判断函数 ====================

/**
 * 检查子订单是否可以申请售后
 * 
 * @param {object} subOrder - 子订单对象
 * @param {object} parentOrder - 父订单对象（可选，用于获取更多信息）
 * @returns {object} { canApply, reason, buttonText }
 */
function canApplyAfterSale(subOrder, parentOrder) {
    if (!subOrder) {
        return { canApply: false, reason: '子订单不存在', buttonText: '' };
    }
    
    // 检查订单状态：只有已发货或已签收的订单可以申请售后
    const validStatuses = ['shipped', 'delivered'];
    if (!validStatuses.includes(subOrder.status)) {
        if (subOrder.status === 'pending_ship') {
            return { canApply: false, reason: '订单尚未发货，暂不支持售后', buttonText: '' };
        }
        return { canApply: false, reason: '当前订单状态不支持售后', buttonText: '' };
    }
    
    // 检查是否已签收超过15天
    if (subOrder.status === 'delivered' && subOrder.deliverTime) {
        const deliverDate = new Date(subOrder.deliverTime);
        const now = new Date();
        const daysDiff = Math.floor((now - deliverDate) / (1000 * 60 * 60 * 24));
        
        if (daysDiff > AFTERSALE_CONFIG.applyDeadlineDays) {
            return { 
                canApply: false, 
                reason: `已超过${AFTERSALE_CONFIG.applyDeadlineDays}天售后时效`, 
                buttonText: '' 
            };
        }
    }
    
    // 检查是否有进行中的售后申请
    const activeAfterSale = hasActiveAfterSale(subOrder.id);
    if (activeAfterSale.hasActive) {
        return { 
            canApply: false, 
            reason: '该订单已有进行中的售后申请', 
            buttonText: '查看售后',
            activeAfterSaleId: activeAfterSale.afterSaleId
        };
    }
    
    return { canApply: true, reason: '', buttonText: '申请售后' };
}

/**
 * 检查子订单是否有进行中的售后申请
 * 
 * @param {string} subOrderId - 子订单ID
 * @returns {object} { hasActive, afterSaleId, afterSale }
 */
function hasActiveAfterSale(subOrderId) {
    if (!subOrderId) {
        return { hasActive: false, afterSaleId: null, afterSale: null };
    }
    
    // 进行中的状态（非完成、非拒绝）
    const activeStatuses = [
        AFTERSALE_STATUS.PENDING,
        AFTERSALE_STATUS.APPROVED,
        AFTERSALE_STATUS.WAITING_RETURN,
        AFTERSALE_STATUS.RETURNING,
        AFTERSALE_STATUS.RECEIVED,
        AFTERSALE_STATUS.RESHIPPING
    ];
    
    const activeAfterSale = DB.afterSales.find(as => 
        as.subOrderId === subOrderId && 
        activeStatuses.includes(as.status)
    );
    
    if (activeAfterSale) {
        return { 
            hasActive: true, 
            afterSaleId: activeAfterSale.id, 
            afterSale: activeAfterSale 
        };
    }
    
    return { hasActive: false, afterSaleId: null, afterSale: null };
}

/**
 * 获取子订单的售后申请入口信息（用于UI展示）
 * 
 * @param {string} subOrderId - 子订单ID
 * @returns {object} 入口信息
 */
function getAfterSaleEntryInfo(subOrderId) {
    const subOrder = DB.subOrders.find(so => so.id === subOrderId);
    if (!subOrder) {
        return { 
            show: false, 
            enabled: false, 
            buttonText: '', 
            tooltip: '子订单不存在',
            hasActive: false,
            activeAfterSaleId: null
        };
    }
    
    const parentOrder = DB.orders.find(o => o.id === subOrder.parentOrderId);
    const result = canApplyAfterSale(subOrder, parentOrder);
    
    // 已发货或已签收状态显示按钮
    const showButton = ['shipped', 'delivered', 'pending_ship'].includes(subOrder.status);
    
    // 检查是否有进行中的售后
    const activeAS = hasActiveAfterSale(subOrderId);
    
    return {
        show: showButton,
        enabled: result.canApply,
        buttonText: result.buttonText || '申请售后',
        tooltip: result.reason,
        hasActive: activeAS.hasActive,
        activeAfterSaleId: result.activeAfterSaleId || activeAS.afterSaleId || null
    };
}

/**
 * 获取可退款商品列表（用于售后申请页面）
 * 
 * @param {string} subOrderId - 子订单ID
 * @returns {array} 可退款商品列表
 */
function getRefundableItems(subOrderId) {
    const subOrder = DB.subOrders.find(so => so.id === subOrderId);
    if (!subOrder) return [];
    
    // 获取该子订单已完成的售后申请中已退款的商品数量
    const completedAfterSales = DB.afterSales.filter(as => 
        as.subOrderId === subOrderId && 
        as.status === AFTERSALE_STATUS.COMPLETED
    );
    
    // 计算每个商品已退款的数量
    const refundedQtyMap = {};
    completedAfterSales.forEach(as => {
        (as.items || []).forEach(item => {
            refundedQtyMap[item.productId] = (refundedQtyMap[item.productId] || 0) + item.qty;
        });
    });
    
    // 返回可退款商品列表
    return subOrder.items.map(item => {
        const refundedQty = refundedQtyMap[item.productId] || 0;
        const remainingQty = item.qty - refundedQty;
        
        return {
            productId: item.productId,
            name: item.name,
            spec: item.spec,
            price: item.price,
            img: item.img,
            purchasedQty: item.qty,
            refundedQty: refundedQty,
            remainingQty: Math.max(0, remainingQty),
            canRefund: remainingQty > 0
        };
    }).filter(item => item.canRefund);
}

/**
 * 获取退货仓库地址列表
 * 
 * @returns {array} 退货仓库地址列表
 */
function getReturnWarehouses() {
    return RETURN_WAREHOUSES;
}

/**
 * 获取默认退货仓库地址
 * 
 * @returns {object|null} 默认退货仓库
 */
function getDefaultReturnWarehouse() {
    return RETURN_WAREHOUSES.find(wh => wh.isDefault) || RETURN_WAREHOUSES[0] || null;
}

/**
 * 获取售后原因选项列表
 * 
 * @returns {array} 售后原因列表
 */
function getAfterSaleReasons() {
    return AFTERSALE_REASONS;
}

/**
 * 获取快递公司列表
 * 
 * @returns {array} 快递公司列表
 */
function getExpressCompanies() {
    return EXPRESS_COMPANIES;
}

// ==================== 售后状态流转函数 ====================

/**
 * 售后状态流转规则定义
 * 定义每个状态可以转换到的下一个状态列表
 */
const AFTERSALE_STATUS_TRANSITIONS = {
    [AFTERSALE_STATUS.PENDING]: [AFTERSALE_STATUS.APPROVED, AFTERSALE_STATUS.REJECTED],
    [AFTERSALE_STATUS.APPROVED]: [AFTERSALE_STATUS.WAITING_RETURN, AFTERSALE_STATUS.COMPLETED], // 仅退款直接完成，退货退款/换货进入待寄回
    [AFTERSALE_STATUS.REJECTED]: [], // 终态
    [AFTERSALE_STATUS.WAITING_RETURN]: [AFTERSALE_STATUS.RETURNING],
    [AFTERSALE_STATUS.RETURNING]: [AFTERSALE_STATUS.RECEIVED],
    [AFTERSALE_STATUS.RECEIVED]: [AFTERSALE_STATUS.COMPLETED, AFTERSALE_STATUS.RESHIPPING], // 退货退款完成，换货进入重新发货
    [AFTERSALE_STATUS.RESHIPPING]: [AFTERSALE_STATUS.COMPLETED],
    [AFTERSALE_STATUS.COMPLETED]: [] // 终态
};

/**
 * 获取当前状态可转换的下一状态列表
 * 
 * @param {string} currentStatus - 当前售后状态
 * @param {string} afterSaleType - 售后类型（可选，用于过滤特定类型的状态转换）
 * @returns {array} 可转换的下一状态列表
 */
function getNextValidStatuses(currentStatus, afterSaleType = null) {
    const validStatuses = AFTERSALE_STATUS_TRANSITIONS[currentStatus] || [];
    
    // 根据售后类型过滤状态
    if (afterSaleType && currentStatus === AFTERSALE_STATUS.APPROVED) {
        // 仅退款：审核通过后直接完成
        if (afterSaleType === AFTERSALE_TYPE.REFUND_ONLY) {
            return [AFTERSALE_STATUS.COMPLETED];
        }
        // 退货退款/换货：审核通过后进入待寄回
        return [AFTERSALE_STATUS.WAITING_RETURN];
    }
    
    if (afterSaleType && currentStatus === AFTERSALE_STATUS.RECEIVED) {
        // 退货退款：收货后直接完成
        if (afterSaleType === AFTERSALE_TYPE.RETURN_REFUND) {
            return [AFTERSALE_STATUS.COMPLETED];
        }
        // 换货：收货后进入重新发货
        if (afterSaleType === AFTERSALE_TYPE.EXCHANGE) {
            return [AFTERSALE_STATUS.RESHIPPING];
        }
    }
    
    return validStatuses;
}

/**
 * 验证状态转换是否合法
 * 
 * @param {string} currentStatus - 当前状态
 * @param {string} nextStatus - 目标状态
 * @param {string} afterSaleType - 售后类型（可选）
 * @returns {boolean} 是否合法
 */
function isValidStatusTransition(currentStatus, nextStatus, afterSaleType = null) {
    const validStatuses = getNextValidStatuses(currentStatus, afterSaleType);
    return validStatuses.includes(nextStatus);
}

/**
 * 执行售后状态转换
 * 
 * @param {string} afterSaleId - 售后单ID
 * @param {string} nextStatus - 目标状态
 * @param {object} extraData - 额外数据（如审核备注、拒绝原因等）
 * @returns {object} { success, error, afterSale }
 */
function transitionAfterSaleStatus(afterSaleId, nextStatus, extraData = {}) {
    const afterSale = DB.afterSales.find(as => as.id === afterSaleId);
    
    if (!afterSale) {
        return { success: false, error: '售后单不存在', afterSale: null };
    }
    
    const currentStatus = afterSale.status;
    
    // 验证状态转换是否合法
    if (!isValidStatusTransition(currentStatus, nextStatus, afterSale.type)) {
        return { 
            success: false, 
            error: `不能从 ${currentStatus} 转换到 ${nextStatus}`, 
            afterSale: null 
        };
    }
    
    const now = new Date().toISOString();
    
    // 更新状态
    afterSale.status = nextStatus;
    afterSale.updateTime = now;
    
    // 根据目标状态处理额外逻辑
    switch (nextStatus) {
        case AFTERSALE_STATUS.APPROVED:
            afterSale.reviewTime = now;
            afterSale.reviewBy = extraData.reviewBy || 'admin';
            afterSale.reviewRemark = extraData.reviewRemark || '';
            // 如果是退货退款或换货，设置退货地址
            if (afterSale.type !== AFTERSALE_TYPE.REFUND_ONLY) {
                const warehouse = extraData.warehouseId 
                    ? RETURN_WAREHOUSES.find(w => w.id === extraData.warehouseId)
                    : getDefaultReturnWarehouse();
                if (warehouse) {
                    afterSale.returnAddress = warehouse.address;
                    afterSale.returnContact = warehouse.contact;
                    afterSale.returnPhone = warehouse.phone;
                }
                // 自动转换到待寄回状态
                afterSale.status = AFTERSALE_STATUS.WAITING_RETURN;
            }
            break;
            
        case AFTERSALE_STATUS.REJECTED:
            afterSale.reviewTime = now;
            afterSale.reviewBy = extraData.reviewBy || 'admin';
            afterSale.rejectReason = extraData.rejectReason || '审核未通过';
            afterSale.reviewRemark = extraData.reviewRemark || '';
            break;
            
        case AFTERSALE_STATUS.RETURNING:
            afterSale.returnExpressCompany = extraData.expressCompany || '';
            afterSale.returnTrackingNo = extraData.trackingNo || '';
            afterSale.returnTime = now;
            break;
            
        case AFTERSALE_STATUS.RECEIVED:
            afterSale.receiveTime = now;
            afterSale.receiveRemark = extraData.receiveRemark || '';
            break;
            
        case AFTERSALE_STATUS.RESHIPPING:
            afterSale.exchangeExpressCompany = extraData.expressCompany || '';
            afterSale.exchangeTrackingNo = extraData.trackingNo || '';
            afterSale.exchangeShipTime = now;
            break;
            
        case AFTERSALE_STATUS.COMPLETED:
            afterSale.completeTime = now;
            // 执行退款（仅退款和退货退款类型）
            if (afterSale.type !== AFTERSALE_TYPE.EXCHANGE) {
                executeRefund(afterSale);
            }
            break;
    }
    
    saveData();
    
    return { success: true, error: null, afterSale: afterSale };
}

/**
 * 执行退款操作（模拟）
 * 
 * @param {object} afterSale - 售后单对象
 */
function executeRefund(afterSale) {
    if (!afterSale) return;
    
    // 退回积分
    if (afterSale.refundPointsAmount > 0) {
        const refundPoints = Math.round(afterSale.refundPointsAmount * 100);
        DB.user.points += refundPoints;
    }
    
    // 退回卡金
    if (afterSale.refundCardAmount > 0) {
        DB.user.cardBalance += afterSale.refundCardAmount;
    }
    
    // 现金退回（模拟，实际需要调用支付接口）
    // afterSale.refundCashAmount 原路退回
    
    console.log(`退款执行完成: 积分 ${afterSale.refundPointsAmount}元, 卡金 ${afterSale.refundCardAmount}元, 现金 ${afterSale.refundCashAmount}元`);
}

/**
 * 检查售后单是否超时（7天未填写物流自动关闭）
 * 
 * @param {string} afterSaleId - 售后单ID
 * @returns {object} { isTimeout, daysPassed }
 */
function checkAfterSaleTimeout(afterSaleId) {
    const afterSale = DB.afterSales.find(as => as.id === afterSaleId);
    
    if (!afterSale) {
        return { isTimeout: false, daysPassed: 0 };
    }
    
    // 只检查待寄回状态
    if (afterSale.status !== AFTERSALE_STATUS.WAITING_RETURN) {
        return { isTimeout: false, daysPassed: 0 };
    }
    
    // 计算审核通过后的天数
    const reviewTime = afterSale.reviewTime ? new Date(afterSale.reviewTime) : null;
    if (!reviewTime) {
        return { isTimeout: false, daysPassed: 0 };
    }
    
    const now = new Date();
    const daysPassed = Math.floor((now - reviewTime) / (1000 * 60 * 60 * 24));
    
    return {
        isTimeout: daysPassed > AFTERSALE_CONFIG.returnDeadlineDays,
        daysPassed: daysPassed
    };
}

/**
 * 检查换货是否需要自动确认收货（发货后7天）
 * 
 * @param {string} afterSaleId - 售后单ID
 * @returns {object} { shouldAutoConfirm, daysPassed }
 */
function checkExchangeAutoConfirm(afterSaleId) {
    const afterSale = DB.afterSales.find(as => as.id === afterSaleId);
    
    if (!afterSale) {
        return { shouldAutoConfirm: false, daysPassed: 0 };
    }
    
    // 只检查换货且重新发货中状态
    if (afterSale.type !== AFTERSALE_TYPE.EXCHANGE || 
        afterSale.status !== AFTERSALE_STATUS.RESHIPPING) {
        return { shouldAutoConfirm: false, daysPassed: 0 };
    }
    
    // 计算发货后的天数
    const shipTime = afterSale.exchangeShipTime ? new Date(afterSale.exchangeShipTime) : null;
    if (!shipTime) {
        return { shouldAutoConfirm: false, daysPassed: 0 };
    }
    
    const now = new Date();
    const daysPassed = Math.floor((now - shipTime) / (1000 * 60 * 60 * 24));
    
    return {
        shouldAutoConfirm: daysPassed >= AFTERSALE_CONFIG.autoConfirmDays,
        daysPassed: daysPassed
    };
}

/**
 * 处理所有超时的售后单
 * 
 * @returns {object} { closedCount, autoConfirmedCount }
 */
function processAfterSaleTimeouts() {
    let closedCount = 0;
    let autoConfirmedCount = 0;
    
    DB.afterSales.forEach(afterSale => {
        // 检查退货超时
        const timeoutResult = checkAfterSaleTimeout(afterSale.id);
        if (timeoutResult.isTimeout) {
            afterSale.status = AFTERSALE_STATUS.REJECTED;
            afterSale.rejectReason = '超时未寄回商品，售后已自动关闭';
            afterSale.updateTime = new Date().toISOString();
            closedCount++;
        }
        
        // 检查换货自动确认
        const autoConfirmResult = checkExchangeAutoConfirm(afterSale.id);
        if (autoConfirmResult.shouldAutoConfirm) {
            afterSale.status = AFTERSALE_STATUS.COMPLETED;
            afterSale.exchangeReceiveTime = new Date().toISOString();
            afterSale.completeTime = new Date().toISOString();
            afterSale.updateTime = new Date().toISOString();
            autoConfirmedCount++;
        }
    });
    
    if (closedCount > 0 || autoConfirmedCount > 0) {
        saveData();
    }
    
    return { closedCount, autoConfirmedCount };
}

// 调试：确认运费函数已加载
console.log('data.js loaded, calculateOrderFreight:', typeof calculateOrderFreight);

// ==================== 运费结算相关函数 ====================

/**
 * 计算订单利润分成（运费独立于利润分成）
 * 
 * 分成规则：
 * - 供应商成本 + 渠道费 + 平台费 = 80%
 * - 代运营服务费 = 5%（可配置）
 * - 商家毛利 = 15%（可配置）
 * 
 * 重要：运费不参与任何分成计算，运费100%归供应商
 * 
 * Property 9: 运费独立于利润分成
 * Validates: Requirements 10.2, 10.3
 * 
 * @param {number} goodsAmount - 商品金额（不含运费）
 * @param {number} freight - 运费金额
 * @param {object} config - 分成配置
 * @returns {object} 利润分成结果
 */
function calculateProfitSharing(goodsAmount, freight, config = {}) {
    // 参数校验和默认值
    const amount = typeof goodsAmount === 'number' && !isNaN(goodsAmount) && goodsAmount >= 0 
        ? goodsAmount : 0;
    const freightAmount = typeof freight === 'number' && !isNaN(freight) && freight >= 0 
        ? freight : 0;
    
    // 使用平台配置或默认值
    const platformConfig = DB.platformConfig || {};
    const supplierCostRate = config.supplierCostRate || 0.80;
    const opsServiceFeeRate = config.opsServiceFeeRate || platformConfig.opsServiceFeeRate || 0.05;
    const merchantMarginRate = config.merchantMarginRate || 0.15;
    const channelFeeRate = config.channelFeeRate || platformConfig.channelFeeRate || 0.0038;
    
    // 计算基数 = 商品金额（不含运费）
    // 重要：运费不参与分成计算
    const profitBase = amount;
    
    // 计算各项分成（基于商品金额，不含运费）
    const supplierCost = Math.round(profitBase * supplierCostRate * 100) / 100;
    const opsServiceFee = Math.round(profitBase * opsServiceFeeRate * 100) / 100;
    const merchantMargin = Math.round(profitBase * merchantMarginRate * 100) / 100;
    const channelFee = Math.round(profitBase * channelFeeRate * 100) / 100;
    
    // 运费100%归供应商，不参与分成
    const supplierFreight = freightAmount;
    
    // 供应商总收入 = 供应商成本分成 + 运费（100%）
    const supplierTotalIncome = Math.round((supplierCost + supplierFreight) * 100) / 100;
    
    return {
        // 分成计算基数（商品金额，不含运费）
        profitBase: profitBase,
        
        // 各项分成（基于商品金额）
        supplierCost: supplierCost,           // 供应商成本分成
        opsServiceFee: opsServiceFee,         // 代运营服务费
        merchantMargin: merchantMargin,       // 商家毛利
        channelFee: channelFee,               // 渠道费
        
        // 运费结算（独立于分成）
        freight: freightAmount,               // 运费金额
        supplierFreight: supplierFreight,     // 供应商应收运费（100%）
        
        // 供应商总收入
        supplierTotalIncome: supplierTotalIncome,
        
        // 验证信息
        freightIncludedInProfitBase: false,   // 运费是否计入分成基数（应为false）
        freightSupplierRate: 1.0              // 运费归供应商比例（应为100%）
    };
}

/**
 * 计算子订单结算金额
 * 
 * Property 10: 运费100%归供应商
 * Validates: Requirements 10.4
 * 
 * @param {string} subOrderId - 子订单ID
 * @param {object} config - 分成配置（可选）
 * @returns {object} 结算金额明细
 */
function calculateSubOrderSettlement(subOrderId, config = {}) {
    const subOrder = DB.subOrders.find(so => so.id === subOrderId);
    
    if (!subOrder) {
        return {
            success: false,
            error: '子订单不存在',
            settlement: null
        };
    }
    
    // 获取商品金额（不含运费）
    const goodsAmount = subOrder.amount || 
        (subOrder.items || []).reduce((sum, item) => sum + (item.price || 0) * (item.qty || 0), 0);
    
    // 获取运费
    const freight = subOrder.freight || 0;
    
    // 计算利润分成
    const profitSharing = calculateProfitSharing(goodsAmount, freight, config);
    
    return {
        success: true,
        subOrderId: subOrder.id,
        supplierId: subOrder.supplierId,
        supplierName: subOrder.supplierName,
        
        // 金额信息
        goodsAmount: goodsAmount,
        freight: freight,
        
        // 结算明细
        settlement: {
            // 供应商应收（成本分成 + 运费）
            supplierSettlement: profitSharing.supplierTotalIncome,
            supplierCostShare: profitSharing.supplierCost,
            supplierFreightShare: profitSharing.supplierFreight,
            
            // 平台收入
            opsServiceFee: profitSharing.opsServiceFee,
            channelFee: profitSharing.channelFee,
            
            // 商家收入
            merchantMargin: profitSharing.merchantMargin
        },
        
        // 验证信息
        verification: {
            profitBase: profitSharing.profitBase,
            freightIncludedInProfitBase: profitSharing.freightIncludedInProfitBase,
            freightSupplierRate: profitSharing.freightSupplierRate
        }
    };
}

/**
 * 计算订单结算汇总（所有子订单）
 * 
 * @param {string} orderId - 父订单ID
 * @param {object} config - 分成配置（可选）
 * @returns {object} 订单结算汇总
 */
function calculateOrderSettlement(orderId, config = {}) {
    const order = DB.orders.find(o => o.id === orderId);
    
    if (!order) {
        return {
            success: false,
            error: '订单不存在',
            settlement: null
        };
    }
    
    const subOrders = DB.subOrders.filter(so => so.parentOrderId === orderId);
    
    if (subOrders.length === 0) {
        return {
            success: false,
            error: '订单无子订单',
            settlement: null
        };
    }
    
    // 计算每个子订单的结算
    const subOrderSettlements = subOrders.map(so => {
        const goodsAmount = so.amount || 
            (so.items || []).reduce((sum, item) => sum + (item.price || 0) * (item.qty || 0), 0);
        const freight = so.freight || 0;
        const profitSharing = calculateProfitSharing(goodsAmount, freight, config);
        
        return {
            subOrderId: so.id,
            supplierId: so.supplierId,
            supplierName: so.supplierName,
            goodsAmount: goodsAmount,
            freight: freight,
            supplierSettlement: profitSharing.supplierTotalIncome,
            supplierCostShare: profitSharing.supplierCost,
            supplierFreightShare: profitSharing.supplierFreight,
            opsServiceFee: profitSharing.opsServiceFee,
            channelFee: profitSharing.channelFee,
            merchantMargin: profitSharing.merchantMargin
        };
    });
    
    // 汇总
    const summary = {
        totalGoodsAmount: subOrderSettlements.reduce((sum, s) => sum + s.goodsAmount, 0),
        totalFreight: subOrderSettlements.reduce((sum, s) => sum + s.freight, 0),
        totalSupplierSettlement: subOrderSettlements.reduce((sum, s) => sum + s.supplierSettlement, 0),
        totalSupplierCostShare: subOrderSettlements.reduce((sum, s) => sum + s.supplierCostShare, 0),
        totalSupplierFreightShare: subOrderSettlements.reduce((sum, s) => sum + s.supplierFreightShare, 0),
        totalOpsServiceFee: subOrderSettlements.reduce((sum, s) => sum + s.opsServiceFee, 0),
        totalChannelFee: subOrderSettlements.reduce((sum, s) => sum + s.channelFee, 0),
        totalMerchantMargin: subOrderSettlements.reduce((sum, s) => sum + s.merchantMargin, 0)
    };
    
    return {
        success: true,
        orderId: orderId,
        subOrderSettlements: subOrderSettlements,
        summary: summary
    };
}

/**
 * 获取供应商待结算运费汇总
 * 
 * @param {string} supplierId - 供应商ID
 * @returns {object} 运费结算汇总
 */
function getSupplierPendingFreight(supplierId) {
    // 获取该供应商所有已完成的子订单
    const completedSubOrders = DB.subOrders.filter(so => 
        so.supplierId === supplierId && 
        so.status === 'delivered'
    );
    
    // 计算总运费
    const totalFreight = completedSubOrders.reduce((sum, so) => sum + (so.freight || 0), 0);
    
    // 计算已退款运费（从售后单中获取）
    const refundedFreight = DB.afterSales
        .filter(as => 
            as.status === 'completed' && 
            completedSubOrders.some(so => so.id === as.subOrderId)
        )
        .reduce((sum, as) => {
            // 如果售后单有运费退款记录
            const subOrder = completedSubOrders.find(so => so.id === as.subOrderId);
            if (subOrder && subOrder.freight > 0 && as.type !== 'exchange') {
                // 按退款比例计算运费退款
                const ratio = as.itemsAmount / (subOrder.amount || 1);
                return sum + (subOrder.freight * ratio);
            }
            return sum;
        }, 0);
    
    return {
        supplierId: supplierId,
        orderCount: completedSubOrders.length,
        totalFreight: Math.round(totalFreight * 100) / 100,
        refundedFreight: Math.round(refundedFreight * 100) / 100,
        pendingFreight: Math.round((totalFreight - refundedFreight) * 100) / 100
    };
}

// 调试：确认结算函数已加载
console.log('data.js loaded, calculateProfitSharing:', typeof calculateProfitSharing);

// ==================== 完整测试数据生成函数 ====================

/**
 * 基于测试用例生成完整的演示数据
 */
function generateCompleteTestData() {
    console.log('🚀 开始基于测试用例生成演示数据...');
    
    try {
        // 清空现有数据
        DB.orders = [];
        DB.subOrders = [];
        DB.afterSales = [];
        DB.orderIdCounter = 1000;
        DB.subOrderIdCounter = 1;
        DB.afterSaleIdCounter = 1;
        
        const results = [];
        const allUsers = Object.values(TEST_USERS);
        
        // 为每个用户生成多样化的测试数据
        allUsers.forEach((user, userIndex) => {
            console.log(`📝 为用户 ${user.name} 生成测试数据...`);
            
            // 根据用户特点生成不同的订单场景
            const userScenarios = getUserScenarios(user, userIndex);
            
            userScenarios.forEach((scenario, scenarioIndex) => {
                const order = createDemoOrder(user, scenario, scenarioIndex);
                if (order) {
                    results.push(order);
                    console.log(`✅ ${user.name}: ${scenario.description} (${order.id})`);
                }
            });
        });
        
        // 生成售后数据
        generateAfterSalesData(results);
        
        // 为每个用户保存独立数据
        saveUserSpecificData(allUsers);
        
        console.log('🎉 演示数据生成完成！');
        console.log(`📊 统计: ${results.length}个订单, ${DB.afterSales.length}个售后`);
        
        return {
            success: true,
            orderCount: results.length,
            afterSaleCount: DB.afterSales.length,
            orders: results
        };
        
    } catch (error) {
        console.error('❌ 生成演示数据失败:', error);
        return { success: false, error: error.message };
    }
}

/**
 * 根据用户特点获取测试场景
 */
function getUserScenarios(user, userIndex) {
    const baseScenarios = [
        // 1. 待支付订单 (10%)
        {
            status: 'pending_pay',
            description: '待支付-新订单',
            paymentType: 'cash',
            products: [{ id: 'P001', qty: 1 }],
            daysAgo: 0
        },
        
        // 2. 待发货订单 (15%)
        {
            status: 'pending_ship', 
            description: '待发货-已支付',
            paymentType: user.memberCards.length > 0 ? 'card' : 'cash',
            products: [{ id: 'P002', qty: 1 }],
            daysAgo: 1
        },
        
        // 3. 已发货订单 (20%)
        {
            status: 'shipped',
            description: '已发货-运输中', 
            paymentType: 'mixed',
            products: [{ id: 'P003', qty: 1 }, { id: 'P004', qty: 1 }],
            daysAgo: 3
        },
        
        // 4. 已完成订单 - 高价值 (25%)
        {
            status: 'completed',
            description: '已完成-高价值订单',
            paymentType: 'coupon_cash',
            products: [{ id: 'P001', qty: 2 }, { id: 'P002', qty: 1 }],
            daysAgo: 7
        },
        
        // 5. 已完成订单 - 积分支付 (25%)
        {
            status: 'completed', 
            description: '已完成-积分支付',
            paymentType: 'points_cash',
            products: [{ id: 'P005', qty: 1 }],
            daysAgo: 15
        }
    ];
    
    // 根据用户特点调整场景
    if (user.addresses.length > 1) {
        // 有偏远地址的用户，添加偏远地区订单
        baseScenarios.push({
            status: 'shipped',
            description: '偏远地区-有运费',
            paymentType: 'cash',
            products: [{ id: 'P001', qty: 1 }],
            useRemoteAddress: true,
            daysAgo: 2
        });
    }
    
    if (userIndex % 3 === 0) {
        // 部分用户有取消订单
        baseScenarios.push({
            status: 'cancelled',
            description: '已取消-用户取消',
            paymentType: 'cash', 
            products: [{ id: 'P003', qty: 1 }],
            daysAgo: 5
        });
    }
    
    return baseScenarios;
}

/**
 * 创建演示订单
 */
function createDemoOrder(user, scenario, scenarioIndex) {
    try {
        const orderId = generateOrderId();
        const now = new Date();
        now.setDate(now.getDate() - scenario.daysAgo);
        
        // 选择地址
        const address = scenario.useRemoteAddress && user.addresses.length > 1 
            ? user.addresses[1] 
            : user.addresses[0];
            
        // 计算商品金额
        const items = scenario.products.map(p => {
            const product = DB.products.find(prod => prod.id === p.id);
            return {
                productId: p.id,
                name: product.name,
                spec: product.spec,
                price: product.price,
                qty: p.qty,
                img: product.img
            };
        });
        
        const goodsAmount = items.reduce((sum, item) => sum + item.price * item.qty, 0);
        
        // 计算运费
        let freight = 0;
        if (scenario.useRemoteAddress) {
            const remoteConfig = PLATFORM_REMOTE_AREAS.find(r => r.province === address.province);
            freight = remoteConfig ? remoteConfig.defaultFreight : 0;
        }
        
        const totalAmount = goodsAmount + freight;
        
        // 设置支付方式
        const payment = calculatePayment(user, scenario.paymentType, totalAmount);
        
        // 创建订单对象
        const order = {
            id: orderId,
            userId: user.id,
            type: 'supply',
            status: scenario.status,
            amount: goodsAmount,
            totalFreight: freight,
            totalAmount: totalAmount,
            address: address,
            payment: payment.details,
            cashPaid: payment.cashPaid,
            createTime: now.toISOString(),
            updateTime: now.toISOString(),
            items: items,
            subOrderIds: [],
            description: scenario.description
        };
        
        // 根据状态设置时间戳
        setOrderTimestamps(order, scenario, now);
        
        // 添加到数据库
        DB.orders.push(order);
        
        return order;
        
    } catch (error) {
        console.error(`创建订单失败 (${user.name}):`, error);
        return null;
    }
}

/**
 * 计算支付方式
 */
function calculatePayment(user, paymentType, totalAmount) {
    let payment = { cash: totalAmount };
    let cashPaid = totalAmount;
    
    switch (paymentType) {
        case 'card':
            if (user.memberCards.length > 0) {
                const card = user.memberCards[0];
                const cardAmount = Math.min(card.balance, totalAmount);
                payment = { card: cardAmount, cardId: card.id };
                if (cardAmount < totalAmount) {
                    payment.cash = totalAmount - cardAmount;
                }
                cashPaid = payment.cash || 0;
            }
            break;
            
        case 'mixed':
            if (user.memberCards.length > 0) {
                const card = user.memberCards[0];
                const cardAmount = Math.min(card.balance, Math.floor(totalAmount * 0.6));
                payment = {
                    card: cardAmount,
                    cardId: card.id,
                    cash: totalAmount - cardAmount
                };
                cashPaid = payment.cash;
            }
            break;
            
        case 'points_cash':
            const maxPoints = Math.min(user.points, Math.floor(totalAmount * 0.3 * 100));
            const pointsValue = Math.floor(maxPoints / 100);
            payment = {
                points: maxPoints,
                cash: totalAmount - pointsValue
            };
            cashPaid = payment.cash;
            break;
            
        case 'coupon_cash':
            if (user.coupons && user.coupons.length > 0) {
                const availableCoupon = user.coupons.find(c => !c.used && totalAmount >= c.minAmount);
                if (availableCoupon) {
                    payment = {
                        coupon: availableCoupon.amount,
                        couponId: availableCoupon.id,
                        cash: totalAmount - availableCoupon.amount
                    };
                    cashPaid = payment.cash;
                }
            }
            break;
    }
    
    return { details: payment, cashPaid: cashPaid };
}

/**
 * 设置订单时间戳
 */
function setOrderTimestamps(order, scenario, baseTime) {
    if (scenario.status !== 'pending_pay') {
        order.payTime = new Date(baseTime.getTime() + 5 * 60000).toISOString();
    }
    
    if (scenario.status === 'shipped' || scenario.status === 'completed') {
        order.shipTime = new Date(baseTime.getTime() + 24 * 3600000).toISOString();
        order.logistics = {
            company: 'SF',
            trackingNumber: 'SF' + Math.random().toString().substr(2, 12),
            status: scenario.status === 'completed' ? 'delivered' : 'in_transit'
        };
    }
    
    if (scenario.status === 'completed') {
        order.receiveTime = new Date(baseTime.getTime() + 72 * 3600000).toISOString();
        order.completeTime = order.receiveTime;
    }
    
    if (scenario.status === 'cancelled') {
        order.cancelTime = new Date(baseTime.getTime() + 10 * 60000).toISOString();
        order.cancelReason = '用户取消';
    }
}

/**
 * 生成售后数据
 *
 * 售后状态说明：
 * - pending: 待审核 - 用户提交售后申请，等待平台客服审核
 * - approved: 审核通过 - 售后申请审核通过（中间状态）
 * - waiting_return: 待寄回 - 审核通过，等待用户填写退货物流
 * - returning: 退货中 - 用户已寄出商品，物流运输中
 * - received: 已收货 - 平台已收到退货，等待确认退款/换货发货
 * - reshipping: 换货发货中 - 换货商品已发出
 * - completed: 已完成 - 售后流程全部完成
 * - rejected: 已拒绝 - 售后申请被平台拒绝
 *
 * 售后类型说明：
 * - refund_only: 仅退款 - 不退货，只申请退款
 * - return_refund: 退货退款 - 退货并申请退款
 * - exchange: 换货 - 更换同款商品（本期暂不支持）
 */
function generateAfterSalesData(orders) {
    console.log('🔄 生成售后数据...');

    // 清空现有售后数据
    DB.afterSales = [];

    // 模拟门店列表
    const mockStores = [
        { id: 'STORE001', name: '北京朝阳店' },
        { id: 'STORE002', name: '上海浦东店' },
        { id: 'STORE003', name: '广州天河店' },
        { id: 'STORE004', name: '深圳福田店' },
        { id: 'STORE005', name: '杭州西湖店' }
    ];

    // 模拟用户列表
    const mockUsers = [
        { id: 'U001', name: '张三' },
        { id: 'U002', name: '李四' },
        { id: 'U003', name: '王五' },
        { id: 'U004', name: '赵六' },
        { id: 'U005', name: '钱七' }
    ];

    // 模拟商品列表
    const mockProducts = [
        { id: 'P001', name: '玻尿酸精华液', spec: '30ml', price: 299 },
        { id: 'P002', name: '胶原蛋白面膜', spec: '5片装', price: 159 },
        { id: 'P003', name: '烟酰胺身体乳', spec: '200ml', price: 89 },
        { id: 'P004', name: '氨基酸洁面乳', spec: '100g', price: 69 },
        { id: 'P005', name: '烟酰胺精华液', spec: '30ml', price: 199 }
    ];

    // 售后原因配置
    const reasonConfigs = [
        { code: 'quality_issue', label: '商品质量问题', freightResponsible: 'supplier' },
        { code: 'not_as_described', label: '商品与描述不符', freightResponsible: 'supplier' },
        { code: 'damaged', label: '收到商品破损', freightResponsible: 'supplier' },
        { code: 'wrong_item', label: '发错货/漏发', freightResponsible: 'supplier' },
        { code: 'no_longer_needed', label: '不想要了', freightResponsible: 'buyer' },
        { code: 'other', label: '其他原因', freightResponsible: 'buyer' }
    ];

    // 快递公司
    const expressCompanies = ['顺丰速运', '中通快递', '圆通速递', '韵达快递', '京东快递'];
    const expressPrefixes = ['SF', 'ZTO', 'YTO', 'YD', 'JD'];

    // 创建模拟订单信息
    function createMockOrderInfo(index) {
        const store = mockStores[index % mockStores.length];
        const user = mockUsers[index % mockUsers.length];
        const orderDate = new Date(Date.now() - (index + 1) * 24 * 3600000);
        const orderId = 'SO' + orderDate.getFullYear().toString() +
            (orderDate.getMonth() + 1).toString().padStart(2, '0') +
            orderDate.getDate().toString().padStart(2, '0') +
            (1000 + index).toString().padStart(4, '0');

        return {
            id: orderId,
            userId: user.id,
            storeId: store.id,
            storeName: store.name,
            userName: user.name,
            createTime: orderDate.toISOString()
        };
    }

    // 创建模拟售后商品
    function createMockAfterSaleItem(productIndex) {
        const product = mockProducts[productIndex % mockProducts.length];
        return {
            productId: product.id,
            name: product.name,
            spec: product.spec,
            price: product.price,
            qty: 1,
            img: '📦'
        };
    }

    let asIndex = 0;

    // ==================== 1. 待审核状态（pending）====================
    console.log('📋 生成待审核状态数据...');
    for (let i = 0; i < 5; i++) {
        const orderInfo = createMockOrderInfo(asIndex);
        const product = mockProducts[i % mockProducts.length];
        const reason = reasonConfigs[i % reasonConfigs.length];
        const itemsAmount = product.price;
        const discountAmount = Math.round(itemsAmount * 0.1 * 100) / 100;
        const freightRefund = i === 0 ? 10 : 0; // 第一个是待发货状态，有运费退款
        const refundAmount = itemsAmount + freightRefund - discountAmount;

        const afterSale = {
            id: 'AS' + String(DB.afterSaleIdCounter++).padStart(6, '0'),
            orderId: orderInfo.id,
            subOrderId: orderInfo.id + '-1',
            userId: orderInfo.userId,
            storeId: orderInfo.storeId,
            storeName: orderInfo.storeName,
            userName: orderInfo.userName,
            type: i % 2 === 0 ? 'refund_only' : 'return_refund',
            status: 'pending',
            reason: reason.label,
            reasonCode: reason.code,
            description: `【测试数据】待审核-售后申请${i + 1}`,
            items: [createMockAfterSaleItem(i)],
            itemsAmount: itemsAmount,
            discountAmount: discountAmount,
            freightRefund: freightRefund,
            refundAmount: refundAmount,
            refundCashAmount: Math.round(refundAmount * 0.7 * 100) / 100,
            refundPointsAmount: Math.round(refundAmount * 0.2 * 100) / 100,
            refundCardAmount: Math.round(refundAmount * 0.1 * 100) / 100,
            freightResponsibility: reason.freightResponsible,
            images: ['https://picsum.photos/800/600?random=' + asIndex],
            createTime: new Date(Date.now() - (i + 1) * 24 * 3600000).toISOString(),
            updateTime: new Date(Date.now() - (i + 1) * 24 * 3600000 + 3600000).toISOString(),
            auditTime: null,
            returnExpressCompany: null,
            returnTrackingNo: null,
            returnTime: null,
            returnAddress: null,
            receiveTime: null,
            qcPassed: false,
            refundTime: null,
            completeTime: null,
            rejectReason: null
        };

        DB.afterSales.push(afterSale);
        asIndex++;
    }

    // ==================== 2. 待寄回状态（waiting_return）====================
    console.log('📤 生成待寄回状态数据...');
    for (let i = 0; i < 3; i++) {
        const orderInfo = createMockOrderInfo(asIndex);
        const product = mockProducts[i % mockProducts.length];
        const reason = reasonConfigs[i % reasonConfigs.length];
        const itemsAmount = product.price;
        const discountAmount = Math.round(itemsAmount * 0.1 * 100) / 100;
        const refundAmount = itemsAmount - discountAmount;
        const createTime = new Date(Date.now() - (5 + i) * 24 * 3600000);

        const afterSale = {
            id: 'AS' + String(DB.afterSaleIdCounter++).padStart(6, '0'),
            orderId: orderInfo.id,
            subOrderId: orderInfo.id + '-1',
            userId: orderInfo.userId,
            storeId: orderInfo.storeId,
            storeName: orderInfo.storeName,
            userName: orderInfo.userName,
            type: 'return_refund',
            status: 'waiting_return',
            reason: reason.label,
            reasonCode: reason.code,
            description: `【测试数据】待寄回-退货退款${i + 1}`,
            items: [createMockAfterSaleItem(i)],
            itemsAmount: itemsAmount,
            discountAmount: discountAmount,
            freightRefund: 0,
            refundAmount: refundAmount,
            refundCashAmount: Math.round(refundAmount * 0.7 * 100) / 100,
            refundPointsAmount: Math.round(refundAmount * 0.2 * 100) / 100,
            refundCardAmount: Math.round(refundAmount * 0.1 * 100) / 100,
            freightResponsibility: reason.freightResponsible,
            images: ['https://picsum.photos/800/600?random=' + asIndex],
            createTime: createTime.toISOString(),
            updateTime: new Date(createTime.getTime() + 3600000).toISOString(),
            auditTime: new Date(createTime.getTime() + 2 * 3600000).toISOString(),
            auditRemark: '审核通过，请寄回商品',
            returnExpressCompany: null,
            returnTrackingNo: null,
            returnTime: null,
            returnAddress: '北京市朝阳区建国路88号退货仓库',
            receiveTime: null,
            qcPassed: false,
            refundTime: null,
            completeTime: null,
            rejectReason: null
        };

        DB.afterSales.push(afterSale);
        asIndex++;
    }

    // ==================== 3. 退货中状态（returning）====================
    console.log('🚛 生成退货中状态数据...');
    for (let i = 0; i < 3; i++) {
        const orderInfo = createMockOrderInfo(asIndex);
        const product = mockProducts[i % mockProducts.length];
        const reason = reasonConfigs[i % reasonConfigs.length];
        const itemsAmount = product.price;
        const discountAmount = Math.round(itemsAmount * 0.1 * 100) / 100;
        const refundAmount = itemsAmount - discountAmount;
        const createTime = new Date(Date.now() - (8 + i) * 24 * 3600000);

        const afterSale = {
            id: 'AS' + String(DB.afterSaleIdCounter++).padStart(6, '0'),
            orderId: orderInfo.id,
            subOrderId: orderInfo.id + '-1',
            userId: orderInfo.userId,
            storeId: orderInfo.storeId,
            storeName: orderInfo.storeName,
            userName: orderInfo.userName,
            type: 'return_refund',
            status: 'returning',
            reason: reason.label,
            reasonCode: reason.code,
            description: `【测试数据】退货中-物流运输${i + 1}`,
            items: [createMockAfterSaleItem(i)],
            itemsAmount: itemsAmount,
            discountAmount: discountAmount,
            freightRefund: 0,
            refundAmount: refundAmount,
            refundCashAmount: Math.round(refundAmount * 0.7 * 100) / 100,
            refundPointsAmount: Math.round(refundAmount * 0.2 * 100) / 100,
            refundCardAmount: Math.round(refundAmount * 0.1 * 100) / 100,
            freightResponsibility: reason.freightResponsible,
            images: ['https://picsum.photos/800/600?random=' + asIndex],
            createTime: createTime.toISOString(),
            updateTime: new Date(createTime.getTime() + 3600000).toISOString(),
            auditTime: new Date(createTime.getTime() + 2 * 3600000).toISOString(),
            auditRemark: '审核通过',
            returnExpressCompany: expressCompanies[i % expressCompanies.length],
            returnTrackingNo: expressPrefixes[i % expressPrefixes.length] + String(Date.now()).slice(-10),
            returnTime: new Date(createTime.getTime() + 24 * 3600000).toISOString(),
            returnAddress: '北京市朝阳区建国路88号退货仓库',
            receiveTime: null,
            qcPassed: false,
            refundTime: null,
            completeTime: null,
            rejectReason: null
        };

        DB.afterSales.push(afterSale);
        asIndex++;
    }

    // ==================== 4. 已收货状态（received）====================
    console.log('📥 生成已收货状态数据...');
    for (let i = 0; i < 3; i++) {
        const orderInfo = createMockOrderInfo(asIndex);
        const product = mockProducts[i % mockProducts.length];
        const reason = reasonConfigs[i % reasonConfigs.length];
        const itemsAmount = product.price;
        const discountAmount = Math.round(itemsAmount * 0.1 * 100) / 100;
        const refundAmount = itemsAmount - discountAmount;
        const createTime = new Date(Date.now() - (12 + i) * 24 * 3600000);

        const afterSale = {
            id: 'AS' + String(DB.afterSaleIdCounter++).padStart(6, '0'),
            orderId: orderInfo.id,
            subOrderId: orderInfo.id + '-1',
            userId: orderInfo.userId,
            storeId: orderInfo.storeId,
            storeName: orderInfo.storeName,
            userName: orderInfo.userName,
            type: i < 2 ? 'return_refund' : 'exchange',
            status: 'received',
            reason: reason.label,
            reasonCode: reason.code,
            description: `【测试数据】已收货-待确认${i + 1}`,
            items: [createMockAfterSaleItem(i)],
            itemsAmount: itemsAmount,
            discountAmount: discountAmount,
            freightRefund: 0,
            refundAmount: refundAmount,
            refundCashAmount: Math.round(refundAmount * 0.7 * 100) / 100,
            refundPointsAmount: Math.round(refundAmount * 0.2 * 100) / 100,
            refundCardAmount: Math.round(refundAmount * 0.1 * 100) / 100,
            freightResponsibility: reason.freightResponsible,
            images: ['https://picsum.photos/800/600?random=' + asIndex],
            createTime: createTime.toISOString(),
            updateTime: new Date(createTime.getTime() + 3600000).toISOString(),
            auditTime: new Date(createTime.getTime() + 2 * 3600000).toISOString(),
            auditRemark: '审核通过',
            returnExpressCompany: expressCompanies[i % expressCompanies.length],
            returnTrackingNo: expressPrefixes[i % expressPrefixes.length] + String(Date.now()).slice(-10),
            returnTime: new Date(createTime.getTime() + 24 * 3600000).toISOString(),
            returnAddress: '北京市朝阳区建国路88号退货仓库',
            receiveTime: new Date(createTime.getTime() + 72 * 3600000).toISOString(),
            qcPassed: true,
            qcRemark: '质检通过，商品状态良好',
            refundTime: null,
            completeTime: null,
            rejectReason: null
        };

        DB.afterSales.push(afterSale);
        asIndex++;
    }

    // ==================== 5. 已完成状态（completed）====================
    console.log('✅ 生成已完成状态数据...');
    for (let i = 0; i < 5; i++) {
        const orderInfo = createMockOrderInfo(asIndex);
        const product = mockProducts[i % mockProducts.length];
        const reason = reasonConfigs[i % reasonConfigs.length];
        const itemsAmount = product.price;
        const discountAmount = Math.round(itemsAmount * 0.1 * 100) / 100;
        const freightRefund = i === 0 ? 10 : 0;
        const refundAmount = itemsAmount + freightRefund - discountAmount;
        const createTime = new Date(Date.now() - (15 + i) * 24 * 3600000);

        const isReturnRefund = i % 2 === 0;

        const afterSale = {
            id: 'AS' + String(DB.afterSaleIdCounter++).padStart(6, '0'),
            orderId: orderInfo.id,
            subOrderId: orderInfo.id + '-1',
            userId: orderInfo.userId,
            storeId: orderInfo.storeId,
            storeName: orderInfo.storeName,
            userName: orderInfo.userName,
            type: isReturnRefund ? 'return_refund' : 'refund_only',
            status: 'completed',
            reason: reason.label,
            reasonCode: reason.code,
            description: `【测试数据】已完成-售后${i + 1}`,
            items: [createMockAfterSaleItem(i)],
            itemsAmount: itemsAmount,
            discountAmount: discountAmount,
            freightRefund: freightRefund,
            refundAmount: refundAmount,
            refundCashAmount: Math.round(refundAmount * 0.7 * 100) / 100,
            refundPointsAmount: Math.round(refundAmount * 0.2 * 100) / 100,
            refundCardAmount: Math.round(refundAmount * 0.1 * 100) / 100,
            freightResponsibility: reason.freightResponsible,
            images: ['https://picsum.photos/800/600?random=' + asIndex],
            createTime: createTime.toISOString(),
            updateTime: new Date(createTime.getTime() + 3600000).toISOString(),
            auditTime: new Date(createTime.getTime() + 2 * 3600000).toISOString(),
            auditRemark: '审核通过',
            returnExpressCompany: isReturnRefund ? expressCompanies[i % expressCompanies.length] : null,
            returnTrackingNo: isReturnRefund ? expressPrefixes[i % expressPrefixes.length] + String(Date.now()).slice(-10) : null,
            returnTime: isReturnRefund ? new Date(createTime.getTime() + 24 * 3600000).toISOString() : null,
            returnAddress: isReturnRefund ? '北京市朝阳区建国路88号退货仓库' : null,
            receiveTime: isReturnRefund ? new Date(createTime.getTime() + 72 * 3600000).toISOString() : null,
            qcPassed: isReturnRefund,
            qcRemark: isReturnRefund ? '质检通过' : null,
            refundTime: new Date(createTime.getTime() + 96 * 3600000).toISOString(),
            completeTime: new Date(createTime.getTime() + 100 * 3600000).toISOString(),
            rejectReason: null
        };

        DB.afterSales.push(afterSale);
        asIndex++;
    }

    // ==================== 6. 已拒绝状态（rejected）====================
    console.log('❌ 生成已拒绝状态数据...');
    for (let i = 0; i < 3; i++) {
        const orderInfo = createMockOrderInfo(asIndex);
        const product = mockProducts[i % mockProducts.length];
        const reason = reasonConfigs[4 + (i % 2)]; // 买家责任原因
        const itemsAmount = product.price;
        const discountAmount = Math.round(itemsAmount * 0.1 * 100) / 100;
        const refundAmount = itemsAmount - discountAmount;
        const createTime = new Date(Date.now() - (20 + i) * 24 * 3600000);

        const rejectReasons = [
            '商品已拆封使用，不符合退货条件',
            '超过售后申请时效（确认收货后15天）',
            '未提供有效质量问题证明材料'
        ];

        const afterSale = {
            id: 'AS' + String(DB.afterSaleIdCounter++).padStart(6, '0'),
            orderId: orderInfo.id,
            subOrderId: orderInfo.id + '-1',
            userId: orderInfo.userId,
            storeId: orderInfo.storeId,
            storeName: orderInfo.storeName,
            userName: orderInfo.userName,
            type: 'refund_only',
            status: 'rejected',
            reason: reason.label,
            reasonCode: reason.code,
            description: `【测试数据】已拒绝-售后${i + 1}`,
            items: [createMockAfterSaleItem(i)],
            itemsAmount: itemsAmount,
            discountAmount: discountAmount,
            freightRefund: 0,
            refundAmount: refundAmount,
            refundCashAmount: Math.round(refundAmount * 0.7 * 100) / 100,
            refundPointsAmount: Math.round(refundAmount * 0.2 * 100) / 100,
            refundCardAmount: Math.round(refundAmount * 0.1 * 100) / 100,
            freightResponsibility: reason.freightResponsible,
            images: ['https://picsum.photos/800/600?random=' + asIndex],
            createTime: createTime.toISOString(),
            updateTime: new Date(createTime.getTime() + 3600000).toISOString(),
            auditTime: new Date(createTime.getTime() + 2 * 3600000).toISOString(),
            auditRemark: '审核拒绝',
            returnExpressCompany: null,
            returnTrackingNo: null,
            returnTime: null,
            returnAddress: null,
            receiveTime: null,
            qcPassed: false,
            refundTime: null,
            completeTime: null,
            rejectReason: rejectReasons[i % rejectReasons.length]
        };

        DB.afterSales.push(afterSale);
        asIndex++;
    }

    console.log(`✅ 生成了 ${DB.afterSales.length} 个售后单，涵盖所有状态`);
}

// 获取售后原因文本
function getReasonText(reason) {
    const map = {
        'quality_issue': '商品质量问题',
        'not_as_described': '商品与描述不符',
        'damaged': '收到商品破损',
        'wrong_item': '发错货/漏发',
        'no_longer_needed': '不想要了'
    };
    return map[reason] || reason;
}

/**
 * 为每个用户保存独立数据
 */
function saveUserSpecificData(allUsers) {
    console.log('💾 保存用户独立数据...');
    
    allUsers.forEach(user => {
        const userOrders = DB.orders.filter(o => o.userId === user.id);
        const userAfterSales = DB.afterSales.filter(as => as.userId === user.id);
        
        const userData = {
            cart: [],
            orders: userOrders,
            subOrders: [],
            afterSales: userAfterSales
        };
        
        localStorage.setItem('s2b2c_user_' + user.id, JSON.stringify(userData));
        console.log(`💾 ${user.name}: ${userOrders.length}订单, ${userAfterSales.length}售后`);
    });
}

/**
 * 创建简单的测试订单
 */
function createSimpleTestOrder(user, userIndex) {
    try {
        console.log(`开始为用户 ${user.name} 创建订单...`);
        
        // 清空购物车
        DB.cart = [];
        
        // 添加一个商品到购物车
        const productId = userIndex % 2 === 0 ? 'P001' : 'P002';
        const qty = 1;
        
        console.log(`添加商品到购物车: ${productId}, 数量: ${qty}`);
        const addResult = addToCart(productId, qty);
        console.log(`添加商品结果:`, addResult);
        
        if (!addResult) {
            console.warn(`添加商品到购物车失败: ${productId}`);
            return null;
        }
        
        // 确保商品被选中
        DB.cart.forEach(item => {
            item.selected = true;
        });
        
        console.log(`购物车状态:`, DB.cart);
        
        if (DB.cart.length === 0) {
            console.warn(`购物车为空: ${user.name}`);
            return null;
        }
        
        // 选择地址
        const address = user.addresses[0];
        if (!address) {
            console.warn(`用户没有地址: ${user.name}`);
            return null;
        }
        
        console.log(`使用地址:`, address);
        
        // 计算订单金额
        const cartItems = getCartItems();
        const goodsTotal = cartItems.reduce((sum, item) => sum + item.product.price * item.qty, 0);
        
        console.log(`商品总金额: ${goodsTotal}`);
        
        // 计算运费
        const freightResult = calculateOrderFreight(address.province, DB.cart);
        const totalFreight = freightResult.totalFreight || 0;
        const orderTotal = goodsTotal + totalFreight;
        
        console.log(`运费: ${totalFreight}, 订单总金额: ${orderTotal}`);
        
        // 设置支付方式（纯现金）
        const payment = { cash: orderTotal };
        const paymentPlan = {
            ...payment,
            freightResult: freightResult
        };
        
        console.log(`支付计划:`, paymentPlan);
        
        // 创建订单
        console.log(`调用createOrder...`);
        const orderResult = createOrder(address.id, paymentPlan, 'supply', false);
        console.log(`创建订单结果:`, orderResult);
        
        if (!orderResult.success) {
            console.warn(`创建订单失败: ${orderResult.error}`);
            return null;
        }
        
        const orderId = orderResult.orderId;
        console.log(`订单创建成功: ${orderId}`);
        
        // 检查订单是否真的被添加到DB中
        const createdOrder = DB.orders.find(o => o.id === orderId);
        console.log(`DB中的订单:`, createdOrder);
        
        return {
            orderId: orderId,
            userId: user.id,
            userName: user.name,
            status: 'pending_pay',
            description: '测试订单'
        };
        
    } catch (error) {
        console.error(`创建测试订单失败 (${user.name}):`, error);
        return null;
    }
}

/**
 * 创建单个测试订单
 */
function createTestOrder(user, config) {
    const {
        status = 'pending_pay',
        paymentType = 'cash',
        products = [],
        description = '',
        useRemoteAddress = false,
        daysAgo = 0
    } = config;
    
    try {
        // 清空购物车
        DB.cart = [];
        
        // 添加商品到购物车并选中
        products.forEach(item => {
            const product = DB.products.find(p => p.id === item.id);
            if (product && product.stock > 0) {
                addToCart(item.id, item.qty);
            }
        });
        
        // 确保所有商品都被选中
        DB.cart.forEach(item => {
            item.selected = true;
        });
        
        if (DB.cart.length === 0) {
            console.warn(`用户 ${user.name} 的订单 ${description} 无可用商品`);
            return null;
        }
        
        // 选择地址
        const address = useRemoteAddress && user.addresses.length > 1 
            ? user.addresses[1] 
            : user.addresses[0];
        
        if (!address) {
            console.warn(`用户 ${user.name} 没有地址`);
            return null;
        }
        
        selectedAddressId = address.id;
        
        // 计算订单金额
        const cartItems = getCartItems();
        const goodsTotal = cartItems.reduce((sum, item) => sum + item.product.price * item.qty, 0);
        
        // 计算运费
        const freightResult = calculateOrderFreight(address.province, DB.cart);
        const totalFreight = freightResult.totalFreight || 0;
        
        const orderTotal = goodsTotal + totalFreight;
        
        // 根据支付类型设置支付方式
        let payment = { cash: orderTotal };
        
        switch (paymentType) {
            case 'card':
                if (user.memberCards.length > 0) {
                    const card = user.memberCards[0];
                    if (card.balance >= orderTotal) {
                        payment = { card: orderTotal, cardId: card.id };
                    }
                }
                break;
            case 'mixed':
                if (user.memberCards.length > 0) {
                    const card = user.memberCards[0];
                    const cardAmount = Math.min(card.balance, Math.floor(orderTotal * 0.6));
                    payment = { 
                        card: cardAmount, 
                        cardId: card.id,
                        cash: orderTotal - cardAmount 
                    };
                }
                break;
            case 'points_cash':
                const pointsValue = Math.min(Math.floor(user.points / 100), Math.floor(orderTotal * 0.3));
                payment = {
                    points: pointsValue * 100,
                    cash: orderTotal - pointsValue
                };
                break;
            case 'coupon_cash':
                if (user.coupons && user.coupons.length > 0) {
                    const coupon = user.coupons.find(c => !c.used && goodsTotal >= c.minAmount);
                    if (coupon) {
                        payment = {
                            coupon: coupon.amount,
                            couponId: coupon.id,
                            cash: orderTotal - coupon.amount
                        };
                    }
                }
                break;
        }
        
        // 创建订单
        const paymentPlan = {
            ...payment,
            freightResult: freightResult
        };
        
        const orderResult = createOrder(selectedAddressId, paymentPlan, 'supply', false);
        
        if (!orderResult.success) {
            console.warn(`创建订单失败: ${description}`);
            return null;
        }
        
        const orderId = orderResult.orderId;
        const order = DB.orders.find(o => o.id === orderId);
        
        if (!order) return null;
        
        // 调整订单时间
        const orderTime = new Date();
        orderTime.setDate(orderTime.getDate() - daysAgo);
        order.createTime = orderTime.toISOString();
        order.updateTime = orderTime.toISOString();
        
        // 根据状态更新订单
        if (status !== 'pending_pay') {
            // 支付订单
            order.status = 'pending_ship';
            order.payTime = new Date(orderTime.getTime() + 5 * 60000).toISOString(); // 5分钟后支付
            
            // 创建子订单
            createSubOrdersForOrder(order);
            
            if (status === 'pending_ship') {
                // 保持待发货状态
            } else if (status === 'shipped') {
                // 发货
                const subOrders = DB.subOrders.filter(so => so.parentOrderId === orderId);
                subOrders.forEach(so => {
                    so.status = 'shipped';
                    so.shipTime = new Date(orderTime.getTime() + 24 * 3600000).toISOString(); // 1天后发货
                    so.logistics = {
                        company: 'SF',
                        trackingNumber: 'SF' + Math.random().toString().substr(2, 12),
                        status: 'in_transit',
                        updateTime: so.shipTime
                    };
                });
                order.status = 'shipped';
            } else if (status === 'completed') {
                // 完成订单
                const subOrders = DB.subOrders.filter(so => so.parentOrderId === orderId);
                subOrders.forEach(so => {
                    so.status = 'completed';
                    so.shipTime = new Date(orderTime.getTime() + 24 * 3600000).toISOString();
                    so.receiveTime = new Date(orderTime.getTime() + 72 * 3600000).toISOString(); // 3天后收货
                    so.logistics = {
                        company: 'SF',
                        trackingNumber: 'SF' + Math.random().toString().substr(2, 12),
                        status: 'delivered',
                        updateTime: so.receiveTime
                    };
                });
                order.status = 'completed';
                order.completeTime = new Date(orderTime.getTime() + 72 * 3600000).toISOString();
            } else if (status === 'cancelled') {
                order.status = 'cancelled';
                order.cancelTime = new Date(orderTime.getTime() + 10 * 60000).toISOString();
                order.cancelReason = '用户取消';
            }
        }
        
        saveData();
        
        console.log(`✓ 创建订单: ${user.name} - ${description} (${orderId})`);
        
        return {
            orderId: orderId,
            userId: user.id,
            userName: user.name,
            status: status,
            description: description
        };
        
    } catch (error) {
        console.error(`创建订单失败 (${description}):`, error);
        return null;
    }
}

/**
 * 创建测试售后单
 */
function createTestAfterSale(user, orderId, config) {
    const {
        type = 'refund_only',
        status = 'pending',
        reason = 'quality_issue',
        description = '',
        daysAgo = 0
    } = config;
    
    try {
        const order = DB.orders.find(o => o.id === orderId);
        if (!order) {
            console.warn(`订单不存在: ${orderId}`);
            return null;
        }
        
        const subOrders = DB.subOrders.filter(so => so.parentOrderId === orderId);
        if (subOrders.length === 0) {
            console.warn(`订单无子订单: ${orderId}`);
            return null;
        }
        
        const subOrder = subOrders[0];
        if (!subOrder.items || subOrder.items.length === 0) {
            console.warn(`子订单无商品: ${subOrder.id}`);
            return null;
        }
        
        // 创建售后单
        const afterSaleId = 'AS' + String(DB.afterSaleIdCounter++).padStart(6, '0');
        const now = new Date();
        now.setDate(now.getDate() - daysAgo);
        
        const afterSale = {
            id: afterSaleId,
            orderId: orderId,
            subOrderId: subOrder.id,
            userId: user.id,
            type: type,
            status: status,
            reason: reason,
            reasonText: AFTERSALE_REASONS.find(r => r.code === reason)?.label || reason,
            description: '测试售后: ' + description,
            items: [subOrder.items[0]], // 只退第一个商品
            refundAmount: subOrder.items[0].price * subOrder.items[0].qty,
            images: [],
            createTime: now.toISOString(),
            updateTime: now.toISOString()
        };
        
        // 根据状态设置时间线
        if (status === 'approved' || status === 'waiting_return' || status === 'completed') {
            afterSale.reviewTime = new Date(now.getTime() + 3600000).toISOString(); // 1小时后审核
            afterSale.reviewResult = 'approved';
            afterSale.reviewNote = '审核通过';
            
            if (type === 'return_refund' || type === 'exchange') {
                afterSale.status = 'waiting_return';
                afterSale.returnAddress = RETURN_WAREHOUSES[0];
            }
        }
        
        if (status === 'completed') {
            if (type === 'refund_only') {
                afterSale.refundTime = new Date(now.getTime() + 7200000).toISOString(); // 2小时后退款
            } else {
                afterSale.returnExpressCompany = 'SF';
                afterSale.returnExpressNo = 'SF' + Math.random().toString().substr(2, 12);
                afterSale.returnTime = new Date(now.getTime() + 86400000).toISOString(); // 1天后寄回
                afterSale.receiveTime = new Date(now.getTime() + 172800000).toISOString(); // 2天后收货
                afterSale.status = 'completed';
                afterSale.completeTime = new Date(now.getTime() + 259200000).toISOString(); // 3天后完成
            }
        }
        
        if (status === 'rejected') {
            afterSale.reviewTime = new Date(now.getTime() + 3600000).toISOString();
            afterSale.reviewResult = 'rejected';
            afterSale.reviewNote = '不符合退款条件';
        }
        
        DB.afterSales.push(afterSale);
        saveData();
        
        console.log(`✓ 创建售后: ${user.name} - ${description} (${afterSaleId})`);
        
        return {
            afterSaleId: afterSaleId,
            orderId: orderId,
            type: type,
            status: status,
            description: description
        };
        
    } catch (error) {
        console.error(`创建售后失败 (${description}):`, error);
        return null;
    }
}

// ==================== 售后配置管理函数 ====================

// 获取售后配置
function getAfterSaleConfig() {
    return DB.afterSaleConfig || JSON.parse(JSON.stringify(AFTERSALE_CONFIG));
}

// 更新售后配置
function updateAfterSaleConfig(config) {
    try {
        // 深度合并配置
        DB.afterSaleConfig = {
            timing: { ...DB.afterSaleConfig.timing, ...(config.timing || {}) },
            freight: { ...DB.afterSaleConfig.freight, ...(config.freight || {}) },
            reasons: { ...DB.afterSaleConfig.reasons, ...(config.reasons || {}) },
            features: { ...DB.afterSaleConfig.features, ...(config.features || {}) },
            settlement: { ...DB.afterSaleConfig.settlement, ...(config.settlement || {}) }
        };
        
        saveData();
        return { success: true, message: '售后配置已更新' };
    } catch (error) {
        console.error('更新售后配置失败:', error);
        return { success: false, error: error.message };
    }
}

// 重置售后配置为默认值
function resetAfterSaleConfig() {
    DB.afterSaleConfig = JSON.parse(JSON.stringify(AFTERSALE_CONFIG));
    saveData();
    return { success: true, message: '售后配置已重置为默认值' };
}

// 获取运费责任方（根据售后原因判断）
function getFreightResponsibility(reason) {
    const config = getAfterSaleConfig();
    if (config.reasons.supplier.includes(reason)) {
        return 'supplier';  // 供应商责任
    }
    return 'buyer';  // 买家责任
}

// ==================== 生成模拟订单数据 ====================

/**
 * 生成模拟订单数据，包含各种状态
 */
function generateMockOrdersForClearing() {
    console.log('开始生成模拟订单数据...');
    
    const now = new Date();
    const stores = getStores();
    const products = DB.products.filter(p => p.type === 'supply'); // 只使用供应链商品
    
    // 确保有足够的商品数据
    if (products.length < 3) {
        console.error('商品数据不足，无法生成订单');
        return;
    }
    
    const mockOrders = [];
    
    // 辅助函数：生成随机日期
    function randomDate(daysAgo) {
        const date = new Date(now);
        date.setDate(date.getDate() - daysAgo);
        date.setHours(Math.floor(Math.random() * 24));
        date.setMinutes(Math.floor(Math.random() * 60));
        return date.toISOString();
    }
    
    // 辅助函数：随机选择
    function randomChoice(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    // 1. 生成"冻结中"状态的订单（订单未完成）
    for (let i = 0; i < 15; i++) {
        const store = randomChoice(stores);
        const product = randomChoice(products);
        const qty = Math.floor(Math.random() * 3) + 1;
        const createTime = randomDate(Math.floor(Math.random() * 5) + 1);

        const orderData = {
            storeId: store.id,
            storeName: store.name,
            items: [{
                productId: product.id,
                name: product.name,
                spec: product.spec || '默认规格',
                price: product.price,
                supplyPrice: product.supplyPrice || product.price * 0.7,
                qty: qty,
                img: product.img || '🎁'
            }],
            status: i % 3 === 0 ? 'pending_pay' : (i % 3 === 1 ? 'paid' : 'partial_shipped'),
            createTime: createTime
        };

        mockOrders.push(orderData);
    }

    // 2. 生成"待结算"状态的订单（已发货但未到结算时间）- 待T+7结算
    // 这些订单的确认时间在7天以内，所以settlementStatus会是pending_t7
    for (let i = 0; i < 30; i++) {
        const store = randomChoice(stores);
        const product = randomChoice(products);
        const qty = Math.floor(Math.random() * 5) + 1;
        const daysAgo = Math.floor(Math.random() * 5) + 1; // 1-5天前
        const createTime = randomDate(daysAgo);
        const deliverTime = new Date(createTime);
        deliverTime.setDate(deliverTime.getDate() + 1); // 下单后1天确认收货

        const orderData = {
            storeId: store.id,
            storeName: store.name,
            items: [{
                productId: product.id,
                name: product.name,
                spec: product.spec || '默认规格',
                price: product.price,
                supplyPrice: product.supplyPrice || product.price * 0.7,
                qty: qty,
                img: product.img || '🎁'
            }],
            status: 'completed',
            createTime: createTime,
            deliverTime: deliverTime.toISOString()
        };

        mockOrders.push(orderData);
    }

    // 3. 生成"已结算90%"状态的订单（签收后7天以上，30天以内）- 待T+30结算
    // 这些订单的确认时间在7-29天之间，所以settlementStatus会是pending_t30
    for (let i = 0; i < 45; i++) {
        const store = randomChoice(stores);
        const product = randomChoice(products);
        const qty = Math.floor(Math.random() * 5) + 1;
        const daysAgo = Math.floor(Math.random() * 20) + 8; // 8-27天前
        const createTime = randomDate(daysAgo);
        const deliverTime = new Date(createTime);
        deliverTime.setDate(deliverTime.getDate() + 1);

        const orderData = {
            storeId: store.id,
            storeName: store.name,
            items: [{
                productId: product.id,
                name: product.name,
                spec: product.spec || '默认规格',
                price: product.price,
                supplyPrice: product.supplyPrice || product.price * 0.7,
                qty: qty,
                img: product.img || '🎁'
            }],
            status: 'completed',
            createTime: createTime,
            deliverTime: deliverTime.toISOString()
        };

        mockOrders.push(orderData);
    }

    // 4. 生成"全部结算"状态的订单（签收后30天以上）
    for (let i = 0; i < 60; i++) {
        const store = randomChoice(stores);
        const product = randomChoice(products);
        const qty = Math.floor(Math.random() * 5) + 1;
        const daysAgo = Math.floor(Math.random() * 30) + 35; // 35-64天前
        const createTime = randomDate(daysAgo);
        const deliverTime = new Date(createTime);
        deliverTime.setDate(deliverTime.getDate() + 2);

        const orderData = {
            storeId: store.id,
            storeName: store.name,
            items: [{
                productId: product.id,
                name: product.name,
                spec: product.spec || '默认规格',
                price: product.price,
                supplyPrice: product.supplyPrice || product.price * 0.7,
                qty: qty,
                img: product.img || '🎁'
            }],
            status: 'completed',
            createTime: createTime,
            deliverTime: deliverTime.toISOString()
        };

        mockOrders.push(orderData);
    }

    // 5. 生成一些多商品订单（包含不同供应商）
    for (let i = 0; i < 30; i++) {
        const store = randomChoice(stores);
        const product1 = products[Math.floor(Math.random() * products.length)];
        const product2 = products[Math.floor(Math.random() * products.length)];
        const daysAgo = Math.floor(Math.random() * 40) + 10;
        const createTime = randomDate(daysAgo);
        const deliverTime = new Date(createTime);
        deliverTime.setDate(deliverTime.getDate() + 2);

        const orderData = {
            storeId: store.id,
            storeName: store.name,
            items: [
                {
                    productId: product1.id,
                    name: product1.name,
                    spec: product1.spec || '默认规格',
                    price: product1.price,
                    supplyPrice: product1.supplyPrice || product1.price * 0.7,
                    qty: Math.floor(Math.random() * 3) + 1,
                    img: product1.img || '🎁'
                },
                {
                    productId: product2.id,
                    name: product2.name,
                    spec: product2.spec || '默认规格',
                    price: product2.price,
                    supplyPrice: product2.supplyPrice || product2.price * 0.7,
                    qty: Math.floor(Math.random() * 3) + 1,
                    img: product2.img || '🎁'
                }
            ],
            status: 'completed',
            createTime: createTime,
            deliverTime: deliverTime.toISOString()
        };

        mockOrders.push(orderData);
    }

    // 6. 生成一些大额订单（提高某些门店的交易排名）
    const topStores = stores.slice(0, 8); // 选取前8个门店作为重点门店
    for (let i = 0; i < 40; i++) {
        const store = topStores[i % topStores.length];
        const product = randomChoice(products);
        const qty = Math.floor(Math.random() * 10) + 5; // 5-14件
        const daysAgo = Math.floor(Math.random() * 50) + 5;
        const createTime = randomDate(daysAgo);
        const deliverTime = new Date(createTime);
        deliverTime.setDate(deliverTime.getDate() + 2);

        const orderData = {
            storeId: store.id,
            storeName: store.name,
            items: [{
                productId: product.id,
                name: product.name,
                spec: product.spec || '默认规格',
                price: product.price,
                supplyPrice: product.supplyPrice || product.price * 0.7,
                qty: qty,
                img: product.img || '🎁'
            }],
            status: 'completed',
            createTime: createTime,
            deliverTime: deliverTime.toISOString()
        };

        mockOrders.push(orderData);
    }

    // 7. 生成不同用户的订单（增加交易人次差异）
    const userIds = ['USER001', 'USER002', 'USER003', 'USER004', 'USER005', 'USER006', 'USER007', 'USER008'];
    for (let i = 0; i < 50; i++) {
        const store = randomChoice(stores);
        const product = randomChoice(products);
        const qty = Math.floor(Math.random() * 4) + 1;
        const daysAgo = Math.floor(Math.random() * 60) + 1;
        const createTime = randomDate(daysAgo);
        const deliverTime = new Date(createTime);
        deliverTime.setDate(deliverTime.getDate() + 1);

        const orderData = {
            storeId: store.id,
            storeName: store.name,
            userId: randomChoice(userIds), // 随机用户
            items: [{
                productId: product.id,
                name: product.name,
                spec: product.spec || '默认规格',
                price: product.price,
                supplyPrice: product.supplyPrice || product.price * 0.7,
                qty: qty,
                img: product.img || '🎁'
            }],
            status: 'completed',
            createTime: createTime,
            deliverTime: deliverTime.toISOString()
        };

        mockOrders.push(orderData);
    }

    // 创建订单并生成清分数据
    console.log(`准备创建 ${mockOrders.length} 个模拟订单...`);
    
    mockOrders.forEach((orderData, index) => {
        try {
            // 直接创建订单对象
            const orderId = `ORD${String(DB.orderIdCounter++).padStart(6, '0')}`;
            const store = stores.find(s => s.id === orderData.storeId);

            // 计算订单总金额
            const totalAmount = orderData.items.reduce((sum, item) => sum + item.price * item.qty, 0);
            const cashPaid = totalAmount;

            // 创建主订单
            const order = {
                id: orderId,
                userId: orderData.userId || 'USER001',
                storeId: orderData.storeId,
                storeName: orderData.storeName,
                merchantId: 'M001',
                type: 'supply',
                status: orderData.status,
                totalAmount: totalAmount,
                totalFreight: 0,
                pointsDeduct: 0,
                cardDeduct: 0,
                cashPaid: cashPaid,
                couponDeduct: 0,
                paymentType: 'cash',
                paymentLabel: '现金支付',
                paymentPlan: {
                    cashPayMethod: 'wechat',
                    cardUsed: 0,
                    cashAmount: cashPaid,
                    pointsDeduct: 0,
                    pointsUsed: 0
                },
                address: { name: '测试用户', phone: '13800138000', province: '北京市', city: '北京市', district: '朝阳区', detail: '测试地址' },
                items: orderData.items,
                subOrderIds: [],
                createTime: orderData.createTime,
                payTime: orderData.createTime,
                updateTime: orderData.createTime
            };
            
            DB.orders.push(order);
            
            // 按供应商分组创建子订单
            const supplierGroups = {};
            orderData.items.forEach(item => {
                const product = products.find(p => p.id === item.productId);
                const supplierId = product ? product.supplierId : 'SUP001';
                if (!supplierGroups[supplierId]) {
                    supplierGroups[supplierId] = [];
                }
                supplierGroups[supplierId].push(item);
            });
            
            Object.keys(supplierGroups).forEach(supplierId => {
                const items = supplierGroups[supplierId];
                const supplier = DB.suppliers.find(s => s.id === supplierId);
                const subOrderId = `${orderId}-${String(DB.subOrderIdCounter++).padStart(2, '0')}`;
                
                const subAmount = items.reduce((sum, item) => sum + item.price * item.qty, 0);
                const subCashPaid = subAmount;
                
                // 计算清分数据
                const headquarterShareRate = store && store.isChain ? (store.headquarterShareRate || 0.10) : 0;
                const clearing = calculateItemClearing(subAmount, subCashPaid, true, true, headquarterShareRate);
                
                // 为每个商品添加清分数据
                const itemsWithClearing = items.map(item => {
                    const itemAmount = item.price * item.qty;
                    const itemRatio = subAmount > 0 ? itemAmount / subAmount : 0;
                    const itemCashPaid = subCashPaid * itemRatio;
                    const itemClearing = calculateItemClearing(itemAmount, itemCashPaid, true, true, headquarterShareRate);
                    
                    return {
                        ...item,
                        clearing: itemClearing
                    };
                });
                
                const subOrder = {
                    id: subOrderId,
                    parentOrderId: orderId,
                    supplierId: supplierId,
                    supplierName: supplier ? supplier.name : '未知供应商',
                    status: orderData.status === 'completed' ? 'completed' : (orderData.status === 'shipped' ? 'shipped' : 'pending_ship'),
                    items: itemsWithClearing,
                    amount: subAmount,
                    supplyAmount: items.reduce((sum, item) => sum + (item.supplyPrice || item.price * 0.7) * item.qty, 0),
                    freight: 0,
                    cashPaid: subCashPaid,
                    pointsDeduct: 0,
                    cardDeduct: 0,
                    clearing: clearing,
                    deliverTime: orderData.deliverTime || null,
                    createTime: orderData.createTime,
                    updateTime: orderData.createTime
                };
                
                DB.subOrders.push(subOrder);
                order.subOrderIds.push(subOrderId);
            });
            
        } catch (error) {
            console.error(`创建第 ${index + 1} 个订单失败:`, error);
        }
    });

    // 6. 创建一些退款订单（已冲账状态）
    console.log('创建退款订单...');
    
    // 找出一些已完成的订单来创建退款
    const completedOrders = DB.orders.filter(o => o.status === 'completed' && o.subOrderIds && o.subOrderIds.length > 0);
    
    for (let i = 0; i < Math.min(3, completedOrders.length); i++) {
        const order = completedOrders[i];
        const subOrderId = order.subOrderIds[0];
        const subOrder = DB.subOrders.find(so => so.id === subOrderId);
        
        if (subOrder && subOrder.items && subOrder.items.length > 0) {
            const item = subOrder.items[0];
            const refundQty = Math.min(item.qty, Math.floor(Math.random() * item.qty) + 1);
            
            try {
                // 创建售后申请
                const afterSaleResult = createAfterSale({
                    subOrderId: subOrderId,
                    type: 'return_refund',
                    reason: randomChoice(['商品质量问题', '商品与描述不符', '不想要了']),
                    description: '模拟退款测试',
                    items: [{
                        productId: item.productId,
                        name: item.name,
                        spec: item.spec,
                        price: item.price,
                        qty: refundQty,
                        img: item.img
                    }],
                    evidence: []
                });
                
                if (afterSaleResult.success) {
                    const afterSaleId = afterSaleResult.afterSaleId;
                    
                    // 自动审核通过
                    approveAfterSale(afterSaleId, '同意退款', 'WH001');
                    
                    // 模拟用户寄回
                    const afterSale = DB.afterSales.find(as => as.id === afterSaleId);
                    if (afterSale) {
                        afterSale.status = 'received';
                        afterSale.receiveTime = new Date().toISOString();
                        
                        // 完成退款
                        completeAfterSale(afterSaleId, true, '质检通过');
                    }
                }
            } catch (error) {
                console.error(`创建退款订单失败:`, error);
            }
        }
    }
    
    console.log(`模拟订单数据生成完成！共创建 ${DB.orders.length} 个订单，${DB.afterSales.filter(as => as.status === 'completed').length} 个退款记录`);
    saveData();
}
