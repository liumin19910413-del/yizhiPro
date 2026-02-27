/**
 * 运费计算属性测试
 * 
 * Feature: freight-feature
 * Property 7: 应付金额包含运费
 * Validates: Requirements 7.3
 */

const fc = require('fast-check');
const { 
    createFreightSnapshot,
    validateFreightSnapshot,
    verifySnapshotImmutability,
    verifySnapshotAfterTemplateUpdate,
    calculatePayableAmount, 
    calculateOrderPayableAmount,
    verifyPayableAmountFormula,
    // 偏远地区运费计算
    calculateSupplierFreight,
    verifyRemoteAreaFreight,
    checkDeliveryAvailable
} = require('./freight-calculator');

// ==================== 数据生成器 ====================

/**
 * 生成有效的金额（正数，保留2位小数）
 */
const amountArb = fc.integer({ min: 0, max: 1000000 })
    .map(a => a / 100);  // 0.00 到 10000.00

/**
 * 生成有效的运费（0-50元范围）
 */
const freightArb = fc.integer({ min: 0, max: 5000 })
    .map(f => f / 100);  // 0.00 到 50.00

/**
 * 生成有效的优惠金额（不超过商品总额）
 */
const discountArbFor = (maxAmount) => fc.integer({ min: 0, max: Math.floor(maxAmount * 100) })
    .map(d => d / 100);

/**
 * 生成订单对象
 */
const orderArb = fc.record({
    totalAmount: amountArb,
    totalFreight: freightArb,
    couponDeduct: fc.integer({ min: 0, max: 10000 }).map(d => d / 100)
}).filter(order => {
    // 确保优惠金额不超过商品总额+运费（合理的业务约束）
    const totalDiscount = order.couponDeduct;
    return totalDiscount <= order.totalAmount + order.totalFreight;
});

// ==================== Property 7: 应付金额包含运费 ====================

describe('Property 7: 应付金额包含运费', () => {
    /**
     * Feature: freight-feature, Property 7: 应付金额包含运费
     * Validates: Requirements 7.3
     * 
     * *For any* 订单，应付金额 = 商品总额 + 总运费 - 优惠金额，且应付金额 >= 0
     */
    test('应付金额 = 商品总额 + 总运费 - 优惠金额', () => {
        fc.assert(
            fc.property(
                amountArb,
                freightArb,
                fc.integer({ min: 0, max: 50000 }).map(d => d / 100),
                (totalAmount, totalFreight, discountAmount) => {
                    const result = calculatePayableAmount(totalAmount, totalFreight, discountAmount);
                    
                    // 计算预期应付金额
                    const expectedPayable = Math.max(0, 
                        Math.round((totalAmount + totalFreight - discountAmount) * 100) / 100
                    );
                    
                    // 验证应付金额公式
                    expect(result.payableAmount).toBeCloseTo(expectedPayable, 2);
                    
                    // 验证breakdown字段
                    expect(result.breakdown.totalAmount).toBeCloseTo(totalAmount, 2);
                    expect(result.breakdown.totalFreight).toBeCloseTo(totalFreight, 2);
                    expect(result.breakdown.discountAmount).toBeCloseTo(discountAmount, 2);
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * 应付金额不为负数
     */
    test('应付金额不为负数', () => {
        fc.assert(
            fc.property(
                amountArb,
                freightArb,
                fc.integer({ min: 0, max: 100000 }).map(d => d / 100),  // 可能超过商品总额的优惠
                (totalAmount, totalFreight, discountAmount) => {
                    const result = calculatePayableAmount(totalAmount, totalFreight, discountAmount);
                    
                    // 应付金额必须 >= 0
                    expect(result.payableAmount).toBeGreaterThanOrEqual(0);
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * 运费为0时，应付金额 = 商品总额 - 优惠金额
     */
    test('运费为0时，应付金额 = 商品总额 - 优惠金额', () => {
        fc.assert(
            fc.property(
                amountArb,
                fc.integer({ min: 0, max: 50000 }).map(d => d / 100),
                (totalAmount, discountAmount) => {
                    const result = calculatePayableAmount(totalAmount, 0, discountAmount);
                    
                    const expectedPayable = Math.max(0, 
                        Math.round((totalAmount - discountAmount) * 100) / 100
                    );
                    
                    expect(result.payableAmount).toBeCloseTo(expectedPayable, 2);
                    expect(result.breakdown.totalFreight).toBe(0);
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * 无优惠时，应付金额 = 商品总额 + 运费
     */
    test('无优惠时，应付金额 = 商品总额 + 运费', () => {
        fc.assert(
            fc.property(
                amountArb,
                freightArb,
                (totalAmount, totalFreight) => {
                    const result = calculatePayableAmount(totalAmount, totalFreight, 0);
                    
                    const expectedPayable = Math.round((totalAmount + totalFreight) * 100) / 100;
                    
                    expect(result.payableAmount).toBeCloseTo(expectedPayable, 2);
                    expect(result.breakdown.discountAmount).toBe(0);
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * 从订单对象计算应付金额
     */
    test('从订单对象计算应付金额', () => {
        fc.assert(
            fc.property(
                orderArb,
                (order) => {
                    const result = calculateOrderPayableAmount(order);
                    
                    const totalDiscount = (order.couponDeduct || 0);
                    const expectedPayable = Math.max(0, 
                        Math.round((order.totalAmount + order.totalFreight - totalDiscount) * 100) / 100
                    );
                    
                    expect(result.payableAmount).toBeCloseTo(expectedPayable, 2);
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * 验证公式正确性函数
     */
    test('验证公式正确性函数', () => {
        fc.assert(
            fc.property(
                amountArb,
                freightArb,
                fc.integer({ min: 0, max: 50000 }).map(d => d / 100),
                (totalAmount, totalFreight, discountAmount) => {
                    const result = calculatePayableAmount(totalAmount, totalFreight, discountAmount);
                    const verification = verifyPayableAmountFormula(
                        totalAmount, 
                        totalFreight, 
                        discountAmount, 
                        result.payableAmount
                    );
                    
                    // 验证公式应该总是正确的
                    expect(verification.isValid).toBe(true);
                    expect(verification.difference).toBeLessThan(0.01);
                }
            ),
            { numRuns: 100 }
        );
    });
});

// ==================== 边界情况测试 ====================

describe('边界情况', () => {
    test('null订单返回零', () => {
        const result = calculateOrderPayableAmount(null);
        expect(result.payableAmount).toBe(0);
        expect(result.breakdown.totalAmount).toBe(0);
        expect(result.breakdown.totalFreight).toBe(0);
        expect(result.breakdown.discountAmount).toBe(0);
    });

    test('空订单对象返回零', () => {
        const result = calculateOrderPayableAmount({});
        expect(result.payableAmount).toBe(0);
    });

    test('NaN参数处理为0', () => {
        const result = calculatePayableAmount(NaN, NaN, NaN);
        expect(result.payableAmount).toBe(0);
        expect(result.breakdown.totalAmount).toBe(0);
        expect(result.breakdown.totalFreight).toBe(0);
        expect(result.breakdown.discountAmount).toBe(0);
    });

    test('负数参数处理', () => {
        // 负数金额应该被正确处理（虽然业务上不应该出现）
        const result = calculatePayableAmount(-100, 10, 5);
        // -100 + 10 - 5 = -95, 但应付金额不能为负，所以是0
        expect(result.payableAmount).toBe(0);
    });

    test('优惠金额超过商品总额+运费时，应付金额为0', () => {
        const result = calculatePayableAmount(100, 10, 200);
        // 100 + 10 - 200 = -90, 应付金额不能为负
        expect(result.payableAmount).toBe(0);
    });

    test('精度测试 - 小数金额', () => {
        const result = calculatePayableAmount(99.99, 10.01, 5.50);
        // 99.99 + 10.01 - 5.50 = 104.50
        expect(result.payableAmount).toBe(104.50);
    });
});


// ==================== Property 8: 运费快照不可变性 ====================

/**
 * 数据生成器 - 运费快照相关
 */

/**
 * 生成有效的子订单ID
 */
const subOrderIdArb = fc.integer({ min: 10000000, max: 99999999 })
    .map(n => 'SO' + n.toString());

/**
 * 生成有效的供应商ID
 */
const supplierIdArb = fc.constantFrom('S001', 'S002', 'S003', 'S004', 'S005');

/**
 * 生成有效的省份
 */
const provinceArb = fc.constantFrom(
    '北京市', '上海市', '广东省', '浙江省', '江苏省',
    '新疆维吾尔自治区', '西藏自治区', '青海省', '内蒙古自治区',
    '四川省', '湖北省', '湖南省', '河南省', '山东省'
);

/**
 * 生成运费模板配置
 */
const freightTemplateArb = fc.record({
    baseFreight: fc.integer({ min: 0, max: 2000 }).map(f => f / 100),
    remoteAreas: fc.array(
        fc.record({
            province: provinceArb,
            freight: fc.integer({ min: 500, max: 2000 }).map(f => f / 100)
        }),
        { minLength: 0, maxLength: 5 }
    )
});

/**
 * 生成运费快照
 */
const freightSnapshotArb = fc.record({
    subOrderId: subOrderIdArb,
    supplierId: supplierIdArb,
    province: provinceArb,
    orderAmount: amountArb,
    freight: freightArb,
    templateVersion: fc.integer({ min: 1, max: 100 })
}).map(data => createFreightSnapshot(
    data.subOrderId,
    data.supplierId,
    data.province,
    data.orderAmount,
    data.freight,
    data.templateVersion
));

describe('Property 8: 运费快照不可变性', () => {
    /**
     * Feature: freight-feature, Property 8: 运费快照不可变性
     * Validates: Requirements 9.1, 9.2, 9.3, 9.4
     * 
     * *For any* 已生成的运费快照，无论后续运费模板如何修改，该快照中的运费金额应保持不变
     */
    test('运费快照包含所有必需字段', () => {
        fc.assert(
            fc.property(
                subOrderIdArb,
                supplierIdArb,
                provinceArb,
                amountArb,
                freightArb,
                fc.integer({ min: 1, max: 100 }),
                (subOrderId, supplierId, province, orderAmount, freight, templateVersion) => {
                    const snapshot = createFreightSnapshot(
                        subOrderId, supplierId, province, orderAmount, freight, templateVersion
                    );
                    
                    const validation = validateFreightSnapshot(snapshot);
                    
                    // 快照应包含所有必需字段
                    expect(validation.isValid).toBe(true);
                    expect(validation.missingFields).toHaveLength(0);
                    
                    // 验证各字段值正确
                    expect(snapshot.subOrderId).toBe(subOrderId);
                    expect(snapshot.supplierId).toBe(supplierId);
                    expect(snapshot.province).toBe(province);
                    expect(snapshot.orderAmount).toBe(orderAmount);
                    expect(snapshot.freight).toBe(freight);
                    expect(snapshot.templateVersion).toBe(templateVersion);
                    expect(snapshot.isFreeShipping).toBe(freight === 0);
                    expect(snapshot.snapshotTime).toBeDefined();
                }
            ),
            { numRuns: 100 }
        );
    });

    test('运费快照创建后内容不变', () => {
        fc.assert(
            fc.property(
                freightSnapshotArb,
                (originalSnapshot) => {
                    // 深拷贝原始快照
                    const snapshotCopy = JSON.parse(JSON.stringify(originalSnapshot));
                    
                    // 验证快照不可变性
                    const result = verifySnapshotImmutability(originalSnapshot, snapshotCopy);
                    
                    expect(result.isImmutable).toBe(true);
                    expect(result.changedFields).toHaveLength(0);
                }
            ),
            { numRuns: 100 }
        );
    });

    test('运费模板更新不影响已生成的快照', () => {
        fc.assert(
            fc.property(
                freightSnapshotArb,
                freightTemplateArb,
                (snapshot, newTemplate) => {
                    // 记录原始运费
                    const originalFreight = snapshot.freight;
                    const originalTemplateVersion = snapshot.templateVersion;
                    
                    // 模拟模板更新后验证快照
                    const result = verifySnapshotAfterTemplateUpdate(snapshot, newTemplate);
                    
                    // 快照本身应该保持不变
                    expect(result.snapshotUnchanged).toBe(true);
                    expect(result.originalFreight).toBe(originalFreight);
                    
                    // 快照中的运费不应该因为模板更新而改变
                    expect(snapshot.freight).toBe(originalFreight);
                    expect(snapshot.templateVersion).toBe(originalTemplateVersion);
                }
            ),
            { numRuns: 100 }
        );
    });

    test('isFreeShipping字段与freight一致', () => {
        fc.assert(
            fc.property(
                subOrderIdArb,
                supplierIdArb,
                provinceArb,
                amountArb,
                freightArb,
                (subOrderId, supplierId, province, orderAmount, freight) => {
                    const snapshot = createFreightSnapshot(
                        subOrderId, supplierId, province, orderAmount, freight
                    );
                    
                    // isFreeShipping应该与freight===0一致
                    expect(snapshot.isFreeShipping).toBe(freight === 0);
                }
            ),
            { numRuns: 100 }
        );
    });

    test('快照时间戳格式正确', () => {
        fc.assert(
            fc.property(
                freightSnapshotArb,
                (snapshot) => {
                    // snapshotTime应该是有效的ISO时间字符串
                    expect(snapshot.snapshotTime).toBeDefined();
                    const date = new Date(snapshot.snapshotTime);
                    expect(date.toString()).not.toBe('Invalid Date');
                }
            ),
            { numRuns: 100 }
        );
    });
});

// ==================== 运费快照边界情况测试 ====================

describe('运费快照边界情况', () => {
    test('null快照验证返回无效', () => {
        const result = validateFreightSnapshot(null);
        expect(result.isValid).toBe(false);
        expect(result.missingFields.length).toBeGreaterThan(0);
    });

    test('空对象快照验证返回无效', () => {
        const result = validateFreightSnapshot({});
        expect(result.isValid).toBe(false);
        expect(result.missingFields.length).toBeGreaterThan(0);
    });

    test('部分字段缺失的快照验证', () => {
        const partialSnapshot = {
            subOrderId: 'SO123',
            supplierId: 'S001',
            province: '北京市'
            // 缺少其他字段
        };
        const result = validateFreightSnapshot(partialSnapshot);
        expect(result.isValid).toBe(false);
        expect(result.missingFields).toContain('orderAmount');
        expect(result.missingFields).toContain('freight');
    });

    test('运费为0时isFreeShipping为true', () => {
        const snapshot = createFreightSnapshot('SO123', 'S001', '北京市', 100, 0);
        expect(snapshot.freight).toBe(0);
        expect(snapshot.isFreeShipping).toBe(true);
    });

    test('运费大于0时isFreeShipping为false', () => {
        const snapshot = createFreightSnapshot('SO123', 'S001', '新疆维吾尔自治区', 100, 10);
        expect(snapshot.freight).toBe(10);
        expect(snapshot.isFreeShipping).toBe(false);
    });

    test('null快照不可变性验证返回false', () => {
        const result = verifySnapshotImmutability(null, null);
        expect(result.isImmutable).toBe(false);
    });

    test('模板更新验证对null快照返回false', () => {
        const result = verifySnapshotAfterTemplateUpdate(null, {});
        expect(result.snapshotUnchanged).toBe(false);
    });
});


// ==================== Property 2: 偏远地区运费计算正确性 ====================

/**
 * 数据生成器 - 运费模板相关
 */

/**
 * 生成运费模板
 */
const freightTemplateArb2 = fc.record({
    supplierId: supplierIdArb,
    baseFreight: fc.integer({ min: 0, max: 2000 }).map(f => f / 100),  // 0-20元
    remoteAreas: fc.array(
        fc.record({
            province: fc.constantFrom(
                '新疆维吾尔自治区', '西藏自治区', '青海省', '内蒙古自治区',
                '宁夏回族自治区', '甘肃省'
            ),
            freight: fc.integer({ min: 500, max: 2000 }).map(f => f / 100)  // 5-20元
        }),
        { minLength: 0, maxLength: 6 }
    ).map(areas => {
        // 去重，确保每个省份只出现一次
        const seen = new Set();
        return areas.filter(a => {
            if (seen.has(a.province)) return false;
            seen.add(a.province);
            return true;
        });
    }),
    noDeliveryAreas: fc.constantFrom(
        [],
        ['台湾省'],
        ['台湾省', '香港特别行政区'],
        ['台湾省', '香港特别行政区', '澳门特别行政区']
    ),
    enabled: fc.boolean()
});

/**
 * 生成所有省份（包括偏远和非偏远）
 */
const allProvincesArb = fc.constantFrom(
    // 非偏远地区
    '北京市', '上海市', '广东省', '浙江省', '江苏省', '四川省', '湖北省', '湖南省',
    // 偏远地区
    '新疆维吾尔自治区', '西藏自治区', '青海省', '内蒙古自治区', '宁夏回族自治区', '甘肃省',
    // 不发货地区
    '台湾省', '香港特别行政区', '澳门特别行政区'
);

describe('Property 2: 偏远地区运费计算正确性', () => {
    /**
     * Feature: freight-feature, Property 2: 偏远地区运费计算正确性
     * Validates: Requirements 2.2, 2.3, 4.1, 4.2
     * 
     * *For any* 收货地址和供应商组合，如果地址省份在供应商的偏远地区列表中，
     * 则运费应等于该省份配置的运费金额；否则应等于基础运费。
     */
    test('偏远地区使用配置的运费，非偏远地区使用基础运费', () => {
        fc.assert(
            fc.property(
                freightTemplateArb2,
                allProvincesArb,
                amountArb,
                (template, province, orderAmount) => {
                    const result = calculateSupplierFreight(template, province, orderAmount);
                    const verification = verifyRemoteAreaFreight(template, province, orderAmount, result);
                    
                    expect(verification.isValid).toBe(true);
                    if (!verification.isValid) {
                        console.log('验证失败:', verification.reason);
                        console.log('模板:', JSON.stringify(template));
                        console.log('省份:', province);
                        console.log('金额:', orderAmount);
                        console.log('结果:', JSON.stringify(result));
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    test('无模板时默认包邮', () => {
        fc.assert(
            fc.property(
                allProvincesArb,
                amountArb,
                (province, orderAmount) => {
                    const result = calculateSupplierFreight(null, province, orderAmount);
                    
                    expect(result.freight).toBe(0);
                    expect(result.isFreeShipping).toBe(true);
                    expect(result.reason).toBe('包邮');
                }
            ),
            { numRuns: 100 }
        );
    });

    test('模板禁用时默认包邮', () => {
        fc.assert(
            fc.property(
                freightTemplateArb2.map(t => ({ ...t, enabled: false })),
                allProvincesArb,
                amountArb,
                (template, province, orderAmount) => {
                    const result = calculateSupplierFreight(template, province, orderAmount);
                    
                    expect(result.freight).toBe(0);
                    expect(result.isFreeShipping).toBe(true);
                }
            ),
            { numRuns: 100 }
        );
    });

    test('偏远地区运费正确匹配', () => {
        fc.assert(
            fc.property(
                freightTemplateArb2.filter(t => t.enabled && t.remoteAreas.length > 0),
                (template) => {
                    // 对于模板中的每个偏远地区，验证运费计算正确
                    template.remoteAreas.forEach(remoteArea => {
                        const orderAmount = 10;  // 小金额
                        const result = calculateSupplierFreight(template, remoteArea.province, orderAmount);
                        
                        expect(result.freight).toBeCloseTo(remoteArea.freight, 2);
                    });
                }
            ),
            { numRuns: 100 }
        );
    });

    test('非偏远地区使用基础运费', () => {
        fc.assert(
            fc.property(
                freightTemplateArb2.filter(t => t.enabled),
                fc.constantFrom('北京市', '上海市', '广东省', '浙江省'),  // 非偏远地区
                (template, province) => {
                    // 确保省份不在偏远地区列表中
                    const isRemote = template.remoteAreas.some(ra => ra.province === province);
                    if (isRemote) return true;  // 跳过
                    
                    const orderAmount = 10;  // 小金额
                    const result = calculateSupplierFreight(template, province, orderAmount);
                    
                    expect(result.freight).toBeCloseTo(template.baseFreight, 2);
                }
            ),
            { numRuns: 100 }
        );
    });
});

// ==================== Property 14: 不发货地区阻止下单 ====================

describe('Property 14: 不发货地区阻止下单', () => {
    /**
     * Feature: freight-feature, Property 14: 不发货地区阻止下单
     * Validates: Requirements 2.5, 4.5
     * 
     * *For any* 收货地址在供应商不发货地区列表中的订单，系统应拒绝创建订单。
     */
    test('不发货地区返回不可配送', () => {
        fc.assert(
            fc.property(
                freightTemplateArb2.filter(t => t.noDeliveryAreas.length > 0),
                (template) => {
                    // 对于模板中的每个不发货地区
                    template.noDeliveryAreas.forEach(province => {
                        const result = checkDeliveryAvailable(template, province);
                        
                        expect(result.canDeliver).toBe(false);
                        expect(result.message).toContain('暂不支持配送');
                    });
                }
            ),
            { numRuns: 100 }
        );
    });

    test('可配送地区返回可配送', () => {
        fc.assert(
            fc.property(
                freightTemplateArb2,
                fc.constantFrom('北京市', '上海市', '广东省', '浙江省'),
                (template, province) => {
                    // 确保省份不在不发货地区列表中
                    if (template.noDeliveryAreas.includes(province)) {
                        return true;  // 跳过
                    }
                    
                    const result = checkDeliveryAvailable(template, province);
                    
                    expect(result.canDeliver).toBe(true);
                    expect(result.message).toBe('');
                }
            ),
            { numRuns: 100 }
        );
    });

    test('无模板时默认可配送', () => {
        fc.assert(
            fc.property(
                allProvincesArb,
                (province) => {
                    const result = checkDeliveryAvailable(null, province);
                    
                    expect(result.canDeliver).toBe(true);
                }
            ),
            { numRuns: 100 }
        );
    });
});

// ==================== 偏远地区运费边界情况测试 ====================

describe('偏远地区运费边界情况', () => {
    test('空模板返回包邮', () => {
        const result = calculateSupplierFreight({}, '北京市', 100);
        expect(result.freight).toBe(0);
        expect(result.isFreeShipping).toBe(true);
    });

    test('负数金额处理为0', () => {
        const template = {
            enabled: true,
            baseFreight: 10
        };
        const result = calculateSupplierFreight(template, '北京市', -100);
        // 负数金额应该被处理为0
        expect(result.freight).toBe(10);
    });

    test('NaN金额处理为0', () => {
        const template = {
            enabled: true,
            baseFreight: 10
        };
        const result = calculateSupplierFreight(template, '北京市', NaN);
        expect(result.freight).toBe(10);
    });

    test('精度测试 - 小数运费', () => {
        const template = {
            enabled: true,
            baseFreight: 5.55,
            remoteAreas: [
                { province: '新疆维吾尔自治区', freight: 10.99 }
            ]
        };
        
        const result1 = calculateSupplierFreight(template, '北京市', 50);
        expect(result1.freight).toBe(5.55);
        
        const result2 = calculateSupplierFreight(template, '新疆维吾尔自治区', 50);
        expect(result2.freight).toBe(10.99);
    });

    test('基础运费为0时非偏远地区包邮', () => {
        const template = {
            enabled: true,
            baseFreight: 0,
            remoteAreas: [
                { province: '新疆维吾尔自治区', freight: 10 }
            ]
        };
        
        const result = calculateSupplierFreight(template, '北京市', 50);
        expect(result.freight).toBe(0);
        expect(result.isFreeShipping).toBe(true);
    });
});
