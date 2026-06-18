// 共享数据存储 - 严格按照需求文档设计
const DataStore = {
    init() {
        // 使用 sessionStorage 传递一次性重置标记
        const isResetMode = sessionStorage.getItem('reset_to_fresh_mode') === 'true';
        // 清除重置标记（只生效一次）
        sessionStorage.removeItem('reset_to_fresh_mode');
        // 每次刷新都重新初始化数据
        localStorage.clear();
        this.initTestData(isResetMode);
        console.log('DataStore: 测试数据已初始化' + (isResetMode ? ' - 重置为未开通状态' : ' - 已开通状态'));
    },

    initTestData(resetToFreshMode = false) {
        // 伊智付商户号数据 - 核心数据，所有合作以此为主体
        const merchants = [
            { 
                id: 'YZF202501001', 
                name: '美丽集团天河店', 
                businessLicense: '91440101MA5CXXXX01', 
                licenseImg: '营业执照图片',
                companyName: '广州天河美丽化妆品有限公司',
                type: 'company', // company公司 | individual个体户
                scope: '化妆品零售;日用品销售;美容服务', 
                hasSubAccount: true, // 是否开通分账功能
                brandId: 'BRAND001', 
                brandName: '美丽集团',
                brandMerchantId: 'YZF202501004', // 品牌总部的商户号
                storeIds: ['STORE001'],
                miniProgramId: 'MP001', // 商城小程序ID
                contactName: '张经理',
                contactPhone: '13800138001'
            },
            { 
                id: 'YZF202501002', 
                name: '美丽集团越秀店', 
                businessLicense: '91440101MA5CXXXX02', 
                licenseImg: '营业执照图片',
                companyName: '广州越秀美丽化妆品有限公司',
                type: 'company',
                scope: '化妆品零售;日用品销售', 
                hasSubAccount: true,
                brandId: 'BRAND001', 
                brandName: '美丽集团',
                brandMerchantId: 'YZF202501004',
                storeIds: ['STORE002'],
                miniProgramId: 'MP002',
                contactName: '李经理',
                contactPhone: '13800138002'
            },
            { 
                id: 'YZF202501003', 
                name: '小美护肤工作室', 
                businessLicense: '91440101MA5CXXXX03', 
                licenseImg: '营业执照图片',
                companyName: '小美护肤工作室',
                type: 'individual', // 个体户
                scope: '化妆品零售', 
                hasSubAccount: true,
                brandId: null, // 单店，无品牌总部
                brandName: null,
                brandMerchantId: null,
                storeIds: ['STORE003'],
                miniProgramId: 'MP003',
                contactName: '王小美',
                contactPhone: '13800138003'
            },
            { 
                id: 'YZF202501004', 
                name: '美丽集团总部', 
                businessLicense: '91440101MA5CXXXX04', 
                licenseImg: '营业执照图片',
                companyName: '广州美丽集团有限公司',
                type: 'company',
                scope: '化妆品批发;化妆品零售;企业管理咨询', 
                hasSubAccount: true,
                brandId: 'BRAND001', 
                brandName: '美丽集团',
                brandMerchantId: null, // 自己就是总部
                storeIds: [],
                miniProgramId: null,
                contactName: '陈总',
                contactPhone: '13800138004'
            },
            { 
                id: 'YZF202501005', 
                name: '彩妆小屋', 
                businessLicense: '91440101MA5CXXXX05', 
                licenseImg: '营业执照图片',
                companyName: '彩妆小屋',
                type: 'individual',
                scope: '美容服务', // 经营范围不符合
                hasSubAccount: false, // 未开通分账
                brandId: null,
                brandName: null,
                brandMerchantId: null,
                storeIds: ['STORE004'],
                miniProgramId: 'MP004',
                contactName: '刘小彩',
                contactPhone: '13800138005'
            }
        ];

        // 门店数据
        const stores = [
            { id: 'STORE001', name: '美丽集团天河店', merchantId: 'YZF202501001', address: '广州市天河区天河路123号' },
            { id: 'STORE002', name: '美丽集团越秀店', merchantId: 'YZF202501002', address: '广州市越秀区中山路456号' },
            { id: 'STORE003', name: '小美护肤工作室', merchantId: 'YZF202501003', address: '广州市番禺区市桥路789号' },
            { id: 'STORE004', name: '彩妆小屋', merchantId: 'YZF202501005', address: '广州市海珠区江南路101号' }
        ];


        // 入驻申请数据 - 按商户号为单位管理
        const applications = [
            { 
                id: 'APP202501001', 
                merchantId: 'YZF202501001',
                loginAccount: 'zhangjingli@meilimall.com',
                loginPhone: '13800138001',
                applicantName: '张经理', 
                applicantPhone: '13800138001',
                brandMerchantId: 'YZF202501004',
                brandRatio: 10,
                profitSettings: [
                    { receiverId: 'PR001', ratio: 10 }
                ],
                status: 'signed',
                createTime: '2025-01-10 10:30:00', 
                auditTime: '2025-01-11 14:00:00', 
                signTime: '2025-01-12 09:00:00',
                merchantRatioRange: '8-12',
                platformRatioRange: '68-72',
                operationRatioRange: '18-22',
                merchantRatio: 10,
                platformRatio: 70,
                operationRatio: 20,
                auditor: '李审核员',
                auditRemark: '资质齐全，经营范围符合要求，同意合作',
                contracts: [
                    { 
                        type: 'dropship', 
                        name: '电商代发协议', 
                        signed: true, 
                        signTime: '2025-01-12 09:00:00',
                        signerAccount: 'zhangjingli@meilimall.com',
                        signerPhone: '13800138001',
                        readDuration: 15,
                        openTime: '2025-01-12 08:45:00',
                        ipAddress: '192.168.1.100',
                        deviceInfo: 'Chrome/Windows'
                    },
                    { 
                        type: 'operation', 
                        name: '代运营合作协议', 
                        signed: true, 
                        signTime: '2025-01-12 09:05:00',
                        signerAccount: 'zhangjingli@meilimall.com',
                        signerPhone: '13800138001',
                        readDuration: 12,
                        openTime: '2025-01-12 08:53:00',
                        ipAddress: '192.168.1.100',
                        deviceInfo: 'Chrome/Windows'
                    }
                ]
            },
            // YZF202501001商户的其他测试申请记录
            { 
                id: 'APP202501006', 
                merchantId: 'YZF202501001',
                loginAccount: 'zhangjingli@meilimall.com',
                loginPhone: '13800138001',
                applicantName: '张经理', 
                applicantPhone: '13800138001',
                brandMerchantId: 'YZF202501004',
                brandRatio: 15,
                status: 'pending',
                createTime: '2025-01-16 09:00:00', 
                auditTime: null, 
                signTime: null,
                merchantRatioRange: null,
                platformRatioRange: null,
                operationRatioRange: null,
                merchantRatio: null,
                platformRatio: null,
                operationRatio: null,
                auditor: null,
                auditRemark: null,
                contracts: []
            },
            { 
                id: 'APP202501008', 
                merchantId: 'YZF202501001',
                loginAccount: 'zhangjingli@meilimall.com',
                loginPhone: '13800138001',
                applicantName: '张经理', 
                applicantPhone: '13800138001',
                brandMerchantId: 'YZF202501004',
                brandRatio: 12,
                status: 'pending_sign',
                createTime: '2025-01-14 14:30:00', 
                auditTime: '2025-01-15 10:00:00', 
                signTime: null,
                merchantRatioRange: '10-15',
                platformRatioRange: '65-70',
                operationRatioRange: '18-22',
                merchantRatio: 12,
                platformRatio: 68,
                operationRatio: 20,
                auditor: '王审核员',
                auditRemark: '审核通过，资质齐全，请尽快签署协议完成入驻',
                contracts: [
                    { 
                        type: 'dropship', 
                        name: '电商代发协议', 
                        signed: false, 
                        signTime: null,
                        signerAccount: null,
                        signerPhone: null,
                        readDuration: null,
                        openTime: null,
                        ipAddress: null,
                        deviceInfo: null
                    },
                    { 
                        type: 'operation', 
                        name: '代运营合作协议', 
                        signed: false, 
                        signTime: null,
                        signerAccount: null,
                        signerPhone: null,
                        readDuration: null,
                        openTime: null,
                        ipAddress: null,
                        deviceInfo: null
                    }
                ]
            },
            { 
                id: 'APP202501009', 
                merchantId: 'YZF202501001',
                loginAccount: 'zhangjingli@meilimall.com',
                loginPhone: '13800138001',
                applicantName: '张经理', 
                applicantPhone: '13800138001',
                brandMerchantId: 'YZF202501004',
                brandRatio: 8,
                status: 'rejected',
                createTime: '2025-01-12 16:00:00', 
                auditTime: '2025-01-13 09:30:00', 
                signTime: null,
                merchantRatioRange: null,
                platformRatioRange: null,
                operationRatioRange: null,
                merchantRatio: null,
                platformRatio: null,
                operationRatio: null,
                auditor: '李审核员',
                auditRemark: '【审核拒绝】提交的营业执照图片不清晰，无法识别关键信息。请重新上传清晰的营业执照正本照片后再次提交申请。',
                rejectReason: '营业执照图片不清晰，无法识别关键信息',
                contracts: []
            },
            { 
                id: 'APP202501002', 
                merchantId: 'YZF202501003',
                loginAccount: 'wangxiaomei@skincare.com',
                loginPhone: '13800138003',
                applicantName: '王小美', 
                applicantPhone: '13800138003',
                brandMerchantId: null, // 单店无品牌总部
                brandRatio: 0,
                status: 'pending_sign',
                createTime: '2025-01-13 11:00:00', 
                auditTime: '2025-01-14 15:00:00', 
                signTime: null,
                merchantRatioRange: '10-15',
                platformRatioRange: '65-70',
                operationRatioRange: '18-22',
                merchantRatio: 12,
                platformRatio: 68,
                operationRatio: 20,
                auditor: '王审核员',
                auditRemark: '审核通过，请尽快签署协议',
                contracts: [
                    { 
                        type: 'platform', 
                        name: '店商供应链合作协议-供应链平台', 
                        signed: false, 
                        signTime: null,
                        signerAccount: null,
                        signerPhone: null,
                        readDuration: null
                    },
                    { 
                        type: 'operation', 
                        name: '店商供应链合作协议-私域运营平台', 
                        signed: false, 
                        signTime: null,
                        signerAccount: null,
                        signerPhone: null,
                        readDuration: null
                    }
                ]
            },
            { 
                id: 'APP202501003', 
                merchantId: 'YZF202501005',
                loginAccount: 'liuxiaocai@makeup.com',
                loginPhone: '13800138005',
                applicantName: '刘小彩', 
                applicantPhone: '13800138005',
                brandMerchantId: null,
                brandRatio: 0,
                status: 'rejected',
                createTime: '2025-01-14 09:00:00', 
                auditTime: '2025-01-14 16:00:00', 
                signTime: null,
                merchantRatioRange: null,
                platformRatioRange: null,
                operationRatioRange: null,
                merchantRatio: null,
                platformRatio: null,
                operationRatio: null,
                auditor: '李审核员',
                auditRemark: '【自动审核拒绝】1.营业执照经营范围不符合要求，需包含"化妆品零售"或"化妆品销售"；2.未开通分账功能，请联系经销商开通',
                contracts: []
            },
            { 
                id: 'APP202501004', 
                merchantId: 'YZF202501002',
                loginAccount: 'lijingli@meilimall.com',
                loginPhone: '13800138002',
                applicantName: '李经理', 
                applicantPhone: '13800138002',
                brandMerchantId: 'YZF202501004',
                brandRatio: 10,
                status: 'pending',
                createTime: '2025-01-15 10:00:00', 
                auditTime: null, 
                signTime: null,
                merchantRatioRange: null,
                platformRatioRange: null,
                operationRatioRange: null,
                merchantRatio: null,
                platformRatio: null,
                operationRatio: null,
                auditor: null,
                auditRemark: null,
                contracts: []
            },
            { 
                id: 'APP202501005', 
                merchantId: 'YZF202501004', 
                applicantName: '陈总', 
                applicantPhone: '13800138004',
                brandMerchantId: null, // 总部自己申请
                brandRatio: 0,
                status: 'need_maintain',
                createTime: '2025-01-12 14:00:00', 
                auditTime: '2025-01-13 10:00:00', 
                signTime: null,
                merchantRatioRange: '10-15',
                platformRatioRange: '65-70',
                operationRatioRange: '18-22',
                merchantRatio: 12,
                platformRatio: 68,
                operationRatio: 20,
                auditor: '王审核员',
                auditRemark: '审核通过，但需要补充营业执照副本，请重新维护资料',
                contracts: []
            },
            { 
                id: 'APP202501007', 
                merchantId: 'YZF202501003', 
                applicantName: '王小美', 
                applicantPhone: '13800138003',
                brandMerchantId: null,
                brandRatio: 0,
                status: 'signed',
                createTime: '2025-01-08 11:00:00', 
                auditTime: '2025-01-09 15:00:00', 
                signTime: '2025-01-10 10:00:00',
                merchantRatioRange: '10-15',
                platformRatioRange: '65-70',
                operationRatioRange: '18-22',
                merchantRatio: 12,
                platformRatio: 68,
                operationRatio: 20,
                auditor: '李审核员',
                auditRemark: '单店申请，资质齐全，同意合作',
                contracts: [
                    { type: 'platform', name: '店商供应链合作协议-供应链平台', signed: true, signTime: '2025-01-10 10:00:00' },
                    { type: 'operation', name: '店商供应链合作协议-私域运营平台', signed: true, signTime: '2025-01-10 10:05:00' }
                ]
            }
        ];

        // 产品数据 - mg端产品维护
        const products = [
            { id: 'PROD001', name: '立体素描眉笔', stock: 500, supplier: '伊智贸易', supplierCode: 'YZ001', price: 28, deliveryMethod: '一件代发', creator: '系统管理员', createTime: '2025-01-01 10:00:00', coverImg: '封面图' },
            { id: 'PROD002', name: '气垫粉底霜', stock: 300, supplier: '伊智贸易', supplierCode: 'YZ001', price: 158, deliveryMethod: '一件代发', creator: '系统管理员', createTime: '2025-01-01 10:00:00', coverImg: '封面图' },
            { id: 'PROD003', name: '腮红膏', stock: 400, supplier: '伊智贸易', supplierCode: 'YZ001', price: 68, deliveryMethod: '一件代发', creator: '系统管理员', createTime: '2025-01-01 10:00:00', coverImg: '封面图' },
            { id: 'PROD004', name: '同心镜', stock: 200, supplier: '伊智贸易', supplierCode: 'YZ001', price: 38, deliveryMethod: '一件代发', creator: '系统管理员', createTime: '2025-01-01 10:00:00', coverImg: '封面图' },
            { id: 'PROD005', name: '精华液30ml', stock: 150, supplier: '伊智贸易', supplierCode: 'YZ001', price: 198, deliveryMethod: '一件代发', creator: '系统管理员', createTime: '2025-01-02 11:00:00', coverImg: '封面图' }
        ];

        // 产品出入库记录
        const stockLogs = [
            { id: 'STK001', productId: 'PROD001', type: 'in', quantity: 500, beforeStock: 0, afterStock: 500, operator: '系统管理员', remark: '初始入库', createTime: '2025-01-01 10:00:00' },
            { id: 'STK002', productId: 'PROD002', type: 'in', quantity: 300, beforeStock: 0, afterStock: 300, operator: '系统管理员', remark: '初始入库', createTime: '2025-01-01 10:00:00' },
            { id: 'STK003', productId: 'PROD001', type: 'out', quantity: 20, beforeStock: 500, afterStock: 480, operator: '系统管理员', remark: '销售出库', createTime: '2025-01-10 14:00:00' }
        ];


        // 商品组合数据 - 由产品组合而成
        const goods = [
            { 
                id: 'SPU001', 
                name: '眉笔双支装', 
                category: '眉部彩妆',
                categoryId: 'CAT001',
                products: [{ productId: 'PROD001', productName: '立体素描眉笔', quantity: 2, lockedPrice: 28 }],
                costPrice: 56, // 成本价 = 28*2
                salePrice: 99, 
                originalPrice: 120, // 商城折前价
                status: 'online',
                deliveryMethod: '一件代发',
                updateTime: '2025-01-05 10:00:00',
                coverImg: '封面图',
                // 不可发货地区
                excludeAreas: ['西藏', '新疆'],
                // 包邮设置
                freeShipping: true,
                shippingTemplateId: 'SHIP001'
            },
            { 
                id: 'SPU002', 
                name: '底妆三件套', 
                category: '面部彩妆',
                categoryId: 'CAT002',
                products: [
                    { productId: 'PROD002', productName: '气垫粉底霜', quantity: 1, lockedPrice: 158 },
                    { productId: 'PROD003', productName: '腮红膏', quantity: 1, lockedPrice: 68 },
                    { productId: 'PROD004', productName: '同心镜', quantity: 1, lockedPrice: 38 }
                ],
                costPrice: 264,
                salePrice: 399, 
                originalPrice: 480,
                status: 'online',
                deliveryMethod: '一件代发',
                updateTime: '2025-01-06 14:00:00',
                coverImg: '封面图',
                excludeAreas: ['西藏'],
                freeShipping: true,
                shippingTemplateId: 'SHIP001'
            },
            { 
                id: 'SPU003', 
                name: '腮红膏双支装', 
                category: '面部彩妆',
                categoryId: 'CAT002',
                products: [{ productId: 'PROD003', productName: '腮红膏', quantity: 2, lockedPrice: 68 }],
                costPrice: 136,
                salePrice: 168, 
                originalPrice: 200,
                status: 'online',
                deliveryMethod: '一件代发',
                updateTime: '2025-01-07 09:00:00',
                coverImg: '封面图',
                excludeAreas: [],
                freeShipping: false,
                shippingTemplateId: 'SHIP002'
            }
        ];

        // 商品价格列表 - 可设置不同时间段的价格
        const goodsPrices = [
            {
                id: 'PRICE001',
                goodsId: 'SPU001',
                salePrice: 99,
                originalPrice: 120,
                startTime: '2025-01-01 00:00:00',
                endTime: '2025-12-31 23:59:59',
                // 分润计算（假设手续费0.6%）
                // 商家佣金比例10%，品牌总部占商家10%
                merchantRatio: 10,
                merchantAmount: 9.84, // (99-0.59)*10% = 9.84
                brandRatio: 10, // 占商家收益
                brandAmount: 0.98, // 9.84*10% = 0.98
                merchantActualAmount: 8.86, // 9.84-0.98 = 8.86
                // 私域运营平台20%
                operationRatio: 20,
                operationAmount: 19.68,
                // 供应链平台70%（经销商10%，伊智贸易90%）
                platformRatio: 70,
                platformAmount: 68.89,
                distributorRatio: 10,
                distributorAmount: 6.89,
                tradeCompanyRatio: 90,
                tradeCompanyAmount: 62.00,
                status: 'active',
                createTime: '2025-01-01 00:00:00'
            },
            {
                id: 'PRICE002',
                goodsId: 'SPU002',
                salePrice: 399,
                originalPrice: 480,
                startTime: '2025-01-01 00:00:00',
                endTime: '2025-12-31 23:59:59',
                merchantRatio: 10,
                merchantAmount: 39.66,
                brandRatio: 10,
                brandAmount: 3.97,
                merchantActualAmount: 35.69,
                operationRatio: 20,
                operationAmount: 79.32,
                platformRatio: 70,
                platformAmount: 277.63,
                distributorRatio: 10,
                distributorAmount: 27.76,
                tradeCompanyRatio: 90,
                tradeCompanyAmount: 249.87,
                status: 'active',
                createTime: '2025-01-01 00:00:00'
            }
        ];

        // 商品操作记录
        const goodsLogs = [
            { id: 'GLOG001', goodsId: 'SPU001', action: '创建商品', operator: '系统管理员', detail: '创建商品组合：眉笔双支装', createTime: '2025-01-05 10:00:00' },
            { id: 'GLOG002', goodsId: 'SPU001', action: '设置价格', operator: '系统管理员', detail: '设置销售价99元', createTime: '2025-01-05 10:05:00' },
            { id: 'GLOG003', goodsId: 'SPU001', action: '上架商品', operator: '系统管理员', detail: '商品上架', createTime: '2025-01-05 10:10:00' }
        ];

        // 商城分类
        const categories = [
            { id: 'CAT001', name: '眉部彩妆', sort: 1 },
            { id: 'CAT002', name: '面部彩妆', sort: 2 },
            { id: 'CAT003', name: '护肤套装', sort: 3 }
        ];

        // 邮费模板
        const shippingTemplates = [
            { id: 'SHIP001', name: '全国包邮', type: 'free', areas: ['全国'] },
            { id: 'SHIP002', name: '标准运费', type: 'standard', defaultFee: 10, areas: [
                { area: '广东', fee: 8 },
                { area: '江浙沪', fee: 10 },
                { area: '其他', fee: 12 }
            ]}
        ];

        // 不可下单地区模板
        const excludeAreaTemplates = [
            { id: 'AREA001', name: '偏远地区', areas: ['西藏', '新疆', '青海', '内蒙古'] },
            { id: 'AREA002', name: '港澳台', areas: ['香港', '澳门', '台湾'] }
        ];


        // 保证金数据 - 按商户号管理
        const deposits = [
            { 
                id: 'DEP001', 
                merchantId: 'YZF202501001',
                totalDeposit: 10000, // 累计充值
                rechargeCount: 2, // 充值次数
                availableDeposit: 6500, // 可使用保证金
                needWithdrawDeposit: 0, // 需提现保证金（营业执照变更时）
                frozenDeposit: 2500, // 冻结中保证金
                settledDeposit: 1000, // 已结算保证金
                invoicedAmount: 800, // 已开票金额
                pendingInvoiceAmount: 200 // 待开票金额
            }
        ];

        // 保证金流水 - 财务时间流
        const depositLogs = [
            { id: 'DEPLOG001', merchantId: 'YZF202501001', type: 'recharge', amount: 5000, balance: 5000, orderId: null, remark: '首次充值-对公转账', payMethod: 'bank', createTime: '2025-01-12 10:00:00' },
            { id: 'DEPLOG002', merchantId: 'YZF202501001', type: 'recharge', amount: 5000, balance: 10000, orderId: null, remark: '追加充值-对公转账', payMethod: 'bank', createTime: '2025-01-13 11:00:00' },
            { id: 'DEPLOG003', merchantId: 'YZF202501001', type: 'freeze', amount: -2500, balance: 7500, orderId: 'ORD001', remark: '订单ORD001保证金冻结', payMethod: null, createTime: '2025-01-14 09:30:00' },
            { id: 'DEPLOG004', merchantId: 'YZF202501001', type: 'settle', amount: -1000, balance: 6500, orderId: 'ORD002', remark: '订单ORD002结算完成', payMethod: null, createTime: '2025-01-15 10:00:00' }
        ];

        // 发票记录
        const invoices = [
            { id: 'INV001', merchantId: 'YZF202501001', amount: 800, invoiceNo: 'FP202501001', invoiceType: '增值税普通发票', invoiceUrl: null, status: 'issued', issueTime: '2025-01-15 14:00:00', uploadTime: null }
        ];

        // 订单数据 - 核心业务数据
        const orders = [
            { 
                id: 'ORD001', 
                merchantId: 'YZF202501001', 
                storeId: 'STORE001',
                storeName: '美丽集团天河店',
                goodsId: 'SPU002', 
                goodsName: '底妆三件套', 
                quantity: 1, 
                totalAmount: 399, // 订单总金额
                wxPayAmount: 100, // 微信支付金额
                otherPayAmount: 299, // 其他支付（卡金、赠金、积分等）
                fee: 0.6, // 交易手续费
                // 分润计算
                netAmount: 398.4, // 扣除手续费后
                merchantProfit: 39.84, // 商家收益 398.4*10%
                brandProfit: 3.98, // 品牌总部收益 39.84*10%
                merchantActualProfit: 35.86, // 商家实际收益
                operationProfit: 79.68, // 私域运营平台收益
                platformProfit: 278.88, // 供应链平台收益
                // 分账情况（微信支付100元，手续费0.6元，可分账99.4元，最多分90%即89.46元）
                // 优先分给品牌总部3.98元，剩余85.48元
                // 再分给私域运营平台，85.48元<79.68元，全部分给私域运营平台85.48元
                // 私域运营平台还差79.68-85.48=-5.8元（实际够了）
                // 但供应链平台278.88元完全没有分到
                wxSplitToBrand: 3.98,
                wxSplitToOperation: 79.68,
                wxSplitToPlatform: 5.74, // 剩余的
                wxSplitToMerchant: 9.4, // 留给商家10%
                // 需要商家充值的保证金
                needDeposit: 273.14, // 278.88-5.74=273.14
                depositPaid: true, // 是否已支付保证金
                canShip: true, // 是否可发货
                status: 'shipped', // pending_deposit待充值 | pending_ship待发货 | shipped已发货 | completed已完成
                customerName: '消费者A',
                customerPhone: '138****1234',
                address: '广州市天河区xxx路xxx号',
                createTime: '2025-01-14 09:00:00',
                payTime: '2025-01-14 09:01:00',
                depositPayTime: '2025-01-14 09:30:00',
                shipTime: '2025-01-14 14:00:00',
                completeTime: null,
                settleTime: null // T+7结算时间
            },
            { 
                id: 'ORD002', 
                merchantId: 'YZF202501001', 
                storeId: 'STORE001',
                storeName: '美丽集团天河店',
                goodsId: 'SPU001', 
                goodsName: '眉笔双支装', 
                quantity: 2, 
                totalAmount: 198,
                wxPayAmount: 198, // 全额微信支付
                otherPayAmount: 0,
                fee: 1.19,
                netAmount: 196.81,
                merchantProfit: 19.68,
                brandProfit: 1.97,
                merchantActualProfit: 17.71,
                operationProfit: 39.36,
                platformProfit: 137.77,
                // 全额微信支付，可以直接分账
                wxSplitToBrand: 1.97,
                wxSplitToOperation: 39.36,
                wxSplitToPlatform: 137.77,
                wxSplitToMerchant: 17.71,
                needDeposit: 0,
                depositPaid: false,
                canShip: true,
                status: 'completed',
                customerName: '消费者B',
                customerPhone: '139****5678',
                address: '广州市越秀区xxx路xxx号',
                createTime: '2025-01-10 15:00:00',
                payTime: '2025-01-10 15:01:00',
                depositPayTime: null,
                shipTime: '2025-01-11 10:00:00',
                completeTime: '2025-01-15 10:00:00',
                settleTime: '2025-01-22 00:00:00'
            },
            { 
                id: 'ORD003', 
                merchantId: 'YZF202501001', 
                storeId: 'STORE001',
                storeName: '美丽集团天河店',
                goodsId: 'SPU003', 
                goodsName: '腮红膏双支装', 
                quantity: 1, 
                totalAmount: 168,
                wxPayAmount: 0, // 全部用卡金支付
                otherPayAmount: 168,
                fee: 0,
                netAmount: 168,
                merchantProfit: 16.8,
                brandProfit: 1.68,
                merchantActualProfit: 15.12,
                operationProfit: 33.6,
                platformProfit: 117.6,
                wxSplitToBrand: 0,
                wxSplitToOperation: 0,
                wxSplitToPlatform: 0,
                wxSplitToMerchant: 0,
                // 全部需要保证金
                needDeposit: 152.88, // 1.68+33.6+117.6
                depositPaid: false,
                canShip: false,
                status: 'pending_deposit',
                customerName: '消费者C',
                customerPhone: '137****9012',
                address: '广州市番禺区xxx路xxx号',
                createTime: '2025-01-15 11:00:00',
                payTime: '2025-01-15 11:01:00',
                depositPayTime: null,
                shipTime: null,
                completeTime: null,
                settleTime: null
            }
        ];


        // 分润规则 - 品牌总部分成配置
        const profitRules = [
            { 
                id: 'RULE001', 
                merchantId: 'YZF202501001', 
                merchantName: '美丽集团天河店',
                brandMerchantId: 'YZF202501004', 
                brandMerchantName: '美丽集团总部',
                brandRatio: 10, // 品牌总部占商家收益的10%
                bindStoreCount: 1
            },
            { 
                id: 'RULE002', 
                merchantId: 'YZF202501002', 
                merchantName: '美丽集团越秀店',
                brandMerchantId: 'YZF202501004', 
                brandMerchantName: '美丽集团总部',
                brandRatio: 10,
                bindStoreCount: 1
            }
        ];

        // 经销商单位配置
        const distributors = [
            { id: 'DIST001', name: '广州经销商', ratio: 10, tradeCompanyRatio: 90, bindMerchantCount: 3 },
            { id: 'DIST002', name: '深圳经销商', ratio: 15, tradeCompanyRatio: 85, bindMerchantCount: 2 }
        ];

        // 商城商品（多规格商品）
        const mallGoods = [
            {
                id: 'MALL001',
                name: '彩妆套装',
                specs: [
                    { specId: 'SPEC001', specName: '基础款', goodsId: 'SPU001', price: 99 },
                    { specId: 'SPEC002', specName: '豪华款', goodsId: 'SPU002', price: 399 }
                ],
                status: 'online',
                coverImg: '封面图'
            }
        ];

        // 售后规则
        const afterSaleRules = [
            { id: 'AS001', name: '7天无理由退换', days: 7, description: '签收后7天内可申请退换货' },
            { id: 'AS002', name: '质量问题退换', days: 15, description: '质量问题15天内可退换' }
        ];

        // 商城装修页面数据
        const mallPages = [
            {
                id: 'PAGE001',
                name: '首页',
                alias: 'home',
                isHomePage: true,
                createTime: '2024-12-01 10:00:00',
                updateTime: '2026-01-22 14:00:00',
                lastEditor: '系统管理员',
                status: 'published', // draft草稿 | published已发布
                components: [] // 页面组件配置，后续添加
            },
            {
                id: 'PAGE002',
                name: '商品列表页',
                alias: 'goods-list',
                isHomePage: false,
                createTime: '2024-12-01 10:30:00',
                updateTime: '2026-01-15 16:20:00',
                lastEditor: '张三',
                status: 'published',
                components: []
            },
            {
                id: 'PAGE003',
                name: '活动页面',
                alias: 'activity',
                isHomePage: false,
                createTime: '2024-12-15 14:00:00',
                updateTime: '2026-01-20 10:30:00',
                lastEditor: '李四',
                status: 'draft',
                components: []
            }
        ];

        // 分账接收方数据 - 用于连锁品牌总部分成管理
        const profitReceivers = [
            {
                id: 'PR001',
                merchantId: 'YZF202501004', // 美丽集团总部
                receiverName: '美丽集团总部',
                receiverAccount: 'YZF202501004',
                receiverType: 'merchant', // merchant商户号 | bank银行账户
                bankName: '中国工商银行',
                bankAccount: '6222021234567890123',
                accountHolder: '广州美丽集团有限公司',
                status: 'active', // active激活 | inactive停用
                createTime: '2024-12-01 10:00:00',
                remark: '美丽集团总部分账接收账户'
            },
            {
                id: 'PR002',
                merchantId: 'YZF202501004',
                receiverName: '美丽集团财务部',
                receiverAccount: '6222021234567890124',
                receiverType: 'bank',
                bankName: '中国建设银行',
                bankAccount: '6222021234567890124',
                accountHolder: '广州美丽集团有限公司',
                status: 'active',
                createTime: '2024-12-01 10:30:00',
                remark: '备用财务账户'
            }
        ];

        // 分账接收方申请记录 - 商户申请添加新的分账接收方
        const profitReceiverApplications = [
            {
                id: 'PRA001',
                applicationId: 'APP202501001', // 关联的入驻申请
                merchantId: 'YZF202501001',
                brandMerchantId: 'YZF202501004',
                receiverName: '美丽集团运营部',
                receiverType: 'bank',
                bankName: '中国农业银行',
                bankAccount: '6228481234567890125',
                accountHolder: '广州美丽集团有限公司',
                idCardNumber: '440101199001011234',
                contactPhone: '13800138004',
                remark: '新增运营部专用分账账户，用于接收门店分成',
                status: 'pending', // pending待审核 | approved已批准 | rejected已拒绝
                createTime: '2024-12-15 14:30:00',
                auditTime: null,
                auditor: null,
                auditRemark: null
            }
        ];

        // 如果是重置为未开通模式，移除YZF202501001商户的已签约申请
        let finalApplications = applications;
        if (resetToFreshMode) {
            finalApplications = applications.filter(app => {
                // 移除YZF202501001商户的所有申请记录，让其从头开始测试
                return app.merchantId !== 'YZF202501001';
            });
            console.log('重置模式：已移除YZF202501001商户的申请记录，可测试完整入驻流程');
        }

        // 存储所有数据
        localStorage.setItem('merchants', JSON.stringify(merchants));
        localStorage.setItem('stores', JSON.stringify(stores));
        localStorage.setItem('applications', JSON.stringify(finalApplications));
        localStorage.setItem('products', JSON.stringify(products));
        localStorage.setItem('stockLogs', JSON.stringify(stockLogs));
        localStorage.setItem('goods', JSON.stringify(goods));
        localStorage.setItem('goodsPrices', JSON.stringify(goodsPrices));
        localStorage.setItem('goodsLogs', JSON.stringify(goodsLogs));
        localStorage.setItem('categories', JSON.stringify(categories));
        localStorage.setItem('shippingTemplates', JSON.stringify(shippingTemplates));
        localStorage.setItem('excludeAreaTemplates', JSON.stringify(excludeAreaTemplates));
        localStorage.setItem('deposits', JSON.stringify(deposits));
        localStorage.setItem('depositLogs', JSON.stringify(depositLogs));
        localStorage.setItem('invoices', JSON.stringify(invoices));
        localStorage.setItem('orders', JSON.stringify(orders));
        localStorage.setItem('profitRules', JSON.stringify(profitRules));
        localStorage.setItem('distributors', JSON.stringify(distributors));
        localStorage.setItem('mallGoods', JSON.stringify(mallGoods));
        localStorage.setItem('afterSaleRules', JSON.stringify(afterSaleRules));
        localStorage.setItem('mallPages', JSON.stringify(mallPages));
        localStorage.setItem('profitReceivers', JSON.stringify(profitReceivers));
        localStorage.setItem('profitReceiverApplications', JSON.stringify(profitReceiverApplications));
        
        // 分账接收方操作日志
        const profitReceiverLogs = [];
        localStorage.setItem('profitReceiverLogs', JSON.stringify(profitReceiverLogs));
        
        // 角色数据
        const roles = [
            {
                id: 'ROLE001',
                name: '店长',
                description: '门店管理员，拥有门店所有权限',
                permissions: {
                    'marketing-apps': ['view'],
                    'supply-chain': ['view', 'edit'],
                    'supply-chain-dashboard': ['view'],
                    'supply-chain-apply': ['view', 'create', 'edit'],
                    'supply-chain-profit-setting': ['view', 'edit'],
                    'supply-chain-goods': ['view'],
                    'supply-chain-deposit': ['view', 'create'],
                    'supply-chain-orders': ['view', 'edit'],
                    'supply-chain-finance': ['view']
                },
                employeeCount: 2,
                createTime: '2025-01-15 10:00:00',
                updateTime: '2025-01-15 10:00:00'
            },
            {
                id: 'ROLE002',
                name: '收银员',
                description: '负责收银和订单处理',
                permissions: {
                    'supply-chain-orders': ['view', 'edit']
                },
                employeeCount: 5,
                createTime: '2025-01-15 10:30:00',
                updateTime: '2025-01-15 10:30:00'
            },
            {
                id: 'ROLE003',
                name: '财务',
                description: '负责财务对账和保证金管理',
                permissions: {
                    'supply-chain-deposit': ['view', 'create'],
                    'supply-chain-finance': ['view'],
                    'supply-chain-profit-setting': ['view']
                },
                employeeCount: 1,
                createTime: '2025-01-15 11:00:00',
                updateTime: '2025-01-15 11:00:00'
            }
        ];
        localStorage.setItem('roles', JSON.stringify(roles));
        
        // 组织架构数据
        const organizations = [
            {
                id: 'ORG001',
                name: '美丽集团总部',
                type: 'headquarters',
                parentId: null,
                managerName: '王总',
                managerId: 'USER001',
                employeeCount: 20,
                createTime: '2025-01-01 09:00:00',
                updateTime: '2025-01-01 09:00:00'
            },
            {
                id: 'ORG002',
                name: '华南区域',
                type: 'region',
                parentId: 'ORG001',
                managerName: '李区长',
                managerId: 'USER002',
                employeeCount: 50,
                createTime: '2025-01-01 09:30:00',
                updateTime: '2025-01-01 09:30:00'
            },
            {
                id: 'ORG003',
                name: '天河店',
                type: 'store',
                parentId: 'ORG002',
                managerName: '张店长',
                managerId: 'USER003',
                employeeCount: 15,
                createTime: '2025-01-01 10:00:00',
                updateTime: '2025-01-01 10:00:00'
            },
            {
                id: 'ORG004',
                name: '越秀店',
                type: 'store',
                parentId: 'ORG002',
                managerName: '刘店长',
                managerId: 'USER004',
                employeeCount: 12,
                createTime: '2025-01-01 10:30:00',
                updateTime: '2025-01-01 10:30:00'
            },
            {
                id: 'ORG005',
                name: '销售部',
                type: 'department',
                parentId: 'ORG003',
                managerName: '陈经理',
                managerId: 'USER005',
                employeeCount: 8,
                createTime: '2025-01-01 11:00:00',
                updateTime: '2025-01-01 11:00:00'
            }
        ];
        localStorage.setItem('organizations', JSON.stringify(organizations));
        
        // 用户角色关联数据
        const userRoles = [
            {
                id: 'UR001',
                userId: 'USER003',
                userName: '张店长',
                roleId: 'ROLE001',
                roleName: '店长',
                assignTime: '2025-01-15 10:00:00',
                assignBy: 'ADMIN001'
            },
            {
                id: 'UR002',
                userId: 'USER004',
                userName: '刘店长',
                roleId: 'ROLE001',
                roleName: '店长',
                assignTime: '2025-01-15 10:00:00',
                assignBy: 'ADMIN001'
            }
        ];
        localStorage.setItem('userRoles', JSON.stringify(userRoles));
        
        // 权限日志数据
        const permissionLogs = [];
        localStorage.setItem('permissionLogs', JSON.stringify(permissionLogs));
    },

    get(key) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    },

    set(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
        window.dispatchEvent(new StorageEvent('storage', { key, newValue: JSON.stringify(data) }));
    },

    add(key, item) {
        const data = this.get(key);
        data.push(item);
        this.set(key, data);
        return item;
    },

    update(key, id, updates) {
        const data = this.get(key);
        const index = data.findIndex(item => item.id === id);
        if (index !== -1) {
            data[index] = { ...data[index], ...updates };
            this.set(key, data);
            return data[index];
        }
        return null;
    },

    delete(key, id) {
        const data = this.get(key);
        const filtered = data.filter(item => item.id !== id);
        this.set(key, filtered);
    },

    findById(key, id) {
        const data = this.get(key);
        return data.find(item => item.id === id);
    },

    findBy(key, field, value) {
        const data = this.get(key);
        return data.filter(item => item[field] === value);
    },

    reset(resetToFreshMode = false) {
        localStorage.clear();
        this.initTestData(resetToFreshMode);
        localStorage.setItem('initialized_v7', 'true');
        console.log('DataStore: 数据已重置' + (resetToFreshMode ? ' - 未开通状态' : ''));
    }
};

DataStore.init();
