/**
 * 售后申请入口属性测试
 * 
 * Feature: aftersale-feature
 * Property 1: 售后申请入口显示条件
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4
 */

const fc = require('fast-check');

// ==================== 模拟数据和函数 ====================

// 售后状态常量
const AFTERSALE_STATUS = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    WAITING_RETURN: 'waiting_return',
    RETURNING: 'returning',
    RECEIVED: 'received',
    RESHIPPING: 'reshipping',
    COMPLETED: 'completed'
};

// 售后配置
const AFTERSALE_CONFIG = {
    applyDeadlineDays: 15
};

// 模拟数据库
let mockDB = {
    afterSales: []
};

/**
 * 检查子订单是否有进行中的售后申请
 */
function hasActiveAfterSale(subOrderId) {
    if (!subOrderId) {
        return { hasActive: false, afterSaleId: null, afterSale: null };
    }
    
    const activeStatuses = [
        AFTERSALE_STATUS.PENDING,
        AFTERSALE_STATUS.APPROVED,
        AFTERSALE_STATUS.WAITING_RETURN,
        AFTERSALE_STATUS.RETURNING,
        AFTERSALE_STATUS.RECEIVED,
        AFTERSALE_STATUS.RESHIPPING
    ];
    
    const activeAfterSale = mockDB.afterSales.find(as => 
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
 * 检查子订单是否可以申请售后
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

// ==================== 数据生成器 ====================

/**
 * 生成子订单ID
 */
const subOrderIdArb = fc.integer({ min: 1, max: 9999 })
    .map(n => `SO${n.toString().padStart(4, '0')}`);

/**
 * 生成订单状态
 */
const orderStatusArb = fc.constantFrom(
    'pending_ship',  // 待发货
    'shipped',       // 已发货
    'delivered',     // 已签收
    'cancelled'      // 已取消
);

/**
 * 生成签收时间（相对于当前时间的天数偏移）
 */
const deliverTimeArb = fc.integer({ min: -30, max: 30 })
    .map(daysOffset => {
        const date = new Date();
        date.setDate(date.getDate() - daysOffset);
        return date.toISOString();
    });

/**
 * 生成子订单
 */
const subOrderArb = fc.record({
    id: subOrderIdArb,
    status: orderStatusArb,
    deliverTime: fc.option(deliverTimeArb, { nil: null })
}).chain(base => {
    // 如果状态是已签收，确保有签收时间
    if (base.status === 'delivered' && !base.deliverTime) {
        return fc.constant({
            ...base,
            deliverTime: new Date().toISOString()
        });
    }
    return fc.constant(base);
});

/**
 * 生成售后状态
 */
const afterSaleStatusArb = fc.constantFrom(
    AFTERSALE_STATUS.PENDING,
    AFTERSALE_STATUS.APPROVED,
    AFTERSALE_STATUS.REJECTED,
    AFTERSALE_STATUS.WAITING_RETURN,
    AFTERSALE_STATUS.RETURNING,
    AFTERSALE_STATUS.RECEIVED,
    AFTERSALE_STATUS.RESHIPPING,
    AFTERSALE_STATUS.COMPLETED
);

/**
 * 生成售后单
 */
const afterSaleArb = fc.record({
    id: fc.integer({ min: 1, max: 9999 }).map(n => `AS${n.toString().padStart(4, '0')}`),
    subOrderId: subOrderIdArb,
    status: afterSaleStatusArb
});

// ==================== Property 1: 售后申请入口显示条件 ====================

describe('Property 1: 售后申请入口显示条件', () => {
    beforeEach(() => {
        // 重置模拟数据库
        mockDB.afterSales = [];
    });

    /**
     * Feature: aftersale-feature, Property 1: 售后申请入口显示条件
     * Validates: Requirements 1.1
     * 
     * WHEN 消费者查看已发货状态的子订单 THEN 应显示"申请售后"按钮
     */
    test('已发货订单可以申请售后', () => {
        fc.assert(
            fc.property(
                subOrderIdArb,
                (subOrderId) => {
                    const subOrder = {
                        id: subOrderId,
                        status: 'shipped',
                        deliverTime: null
                    };
                    
                    const result = canApplyAfterSale(subOrder, null);
                    
                    expect(result.canApply).toBe(true);
                    expect(result.buttonText).toBe('申请售后');
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Validates: Requirements 1.2
     * 
     * WHEN 消费者查看已签收且在15天内的子订单 THEN 应显示"申请售后"按钮
     */
    test('已签收15天内订单可以申请售后', () => {
        fc.assert(
            fc.property(
                subOrderIdArb,
                fc.integer({ min: 0, max: 15 }),  // 0-15天内
                (subOrderId, daysAgo) => {
                    const deliverDate = new Date();
                    deliverDate.setDate(deliverDate.getDate() - daysAgo);
                    
                    const subOrder = {
                        id: subOrderId,
                        status: 'delivered',
                        deliverTime: deliverDate.toISOString()
                    };
                    
                    const result = canApplyAfterSale(subOrder, null);
                    
                    expect(result.canApply).toBe(true);
                    expect(result.buttonText).toBe('申请售后');
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Validates: Requirements 1.3
     * 
     * WHEN 消费者查看已签收超过15天的子订单 THEN 应隐藏"申请售后"按钮
     */
    test('已签收超过15天订单不能申请售后', () => {
        fc.assert(
            fc.property(
                subOrderIdArb,
                fc.integer({ min: 16, max: 365 }),  // 超过15天
                (subOrderId, daysAgo) => {
                    const deliverDate = new Date();
                    deliverDate.setDate(deliverDate.getDate() - daysAgo);
                    
                    const subOrder = {
                        id: subOrderId,
                        status: 'delivered',
                        deliverTime: deliverDate.toISOString()
                    };
                    
                    const result = canApplyAfterSale(subOrder, null);
                    
                    expect(result.canApply).toBe(false);
                    expect(result.reason).toContain('15天');
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Validates: Requirements 1.4
     * 
     * WHEN 子订单已存在进行中的售后申请 THEN 应禁用"申请售后"按钮并显示提示信息
     */
    test('存在进行中售后时不能再次申请', () => {
        const activeStatuses = [
            AFTERSALE_STATUS.PENDING,
            AFTERSALE_STATUS.APPROVED,
            AFTERSALE_STATUS.WAITING_RETURN,
            AFTERSALE_STATUS.RETURNING,
            AFTERSALE_STATUS.RECEIVED,
            AFTERSALE_STATUS.RESHIPPING
        ];

        fc.assert(
            fc.property(
                subOrderIdArb,
                fc.constantFrom(...activeStatuses),
                (subOrderId, afterSaleStatus) => {
                    // 设置存在进行中的售后
                    mockDB.afterSales = [{
                        id: 'AS0001',
                        subOrderId: subOrderId,
                        status: afterSaleStatus
                    }];
                    
                    const subOrder = {
                        id: subOrderId,
                        status: 'shipped',
                        deliverTime: null
                    };
                    
                    const result = canApplyAfterSale(subOrder, null);
                    
                    expect(result.canApply).toBe(false);
                    expect(result.reason).toContain('进行中');
                    expect(result.buttonText).toBe('查看售后');
                    expect(result.activeAfterSaleId).toBe('AS0001');
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * 已完成或已拒绝的售后不影响新申请
     */
    test('已完成或已拒绝的售后不影响新申请', () => {
        const inactiveStatuses = [
            AFTERSALE_STATUS.COMPLETED,
            AFTERSALE_STATUS.REJECTED
        ];

        fc.assert(
            fc.property(
                subOrderIdArb,
                fc.constantFrom(...inactiveStatuses),
                (subOrderId, afterSaleStatus) => {
                    // 设置已完成/已拒绝的售后
                    mockDB.afterSales = [{
                        id: 'AS0001',
                        subOrderId: subOrderId,
                        status: afterSaleStatus
                    }];
                    
                    const subOrder = {
                        id: subOrderId,
                        status: 'shipped',
                        deliverTime: null
                    };
                    
                    const result = canApplyAfterSale(subOrder, null);
                    
                    expect(result.canApply).toBe(true);
                    expect(result.buttonText).toBe('申请售后');
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * 待发货订单不能申请售后
     */
    test('待发货订单不能申请售后', () => {
        fc.assert(
            fc.property(
                subOrderIdArb,
                (subOrderId) => {
                    const subOrder = {
                        id: subOrderId,
                        status: 'pending_ship',
                        deliverTime: null
                    };
                    
                    const result = canApplyAfterSale(subOrder, null);
                    
                    expect(result.canApply).toBe(false);
                    expect(result.reason).toContain('尚未发货');
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * 已取消订单不能申请售后
     */
    test('已取消订单不能申请售后', () => {
        fc.assert(
            fc.property(
                subOrderIdArb,
                (subOrderId) => {
                    const subOrder = {
                        id: subOrderId,
                        status: 'cancelled',
                        deliverTime: null
                    };
                    
                    const result = canApplyAfterSale(subOrder, null);
                    
                    expect(result.canApply).toBe(false);
                    expect(result.reason).toContain('不支持售后');
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * null子订单返回不可申请
     */
    test('null子订单返回不可申请', () => {
        const result = canApplyAfterSale(null, null);
        
        expect(result.canApply).toBe(false);
        expect(result.reason).toContain('不存在');
    });
});

// ==================== hasActiveAfterSale 函数测试 ====================

describe('hasActiveAfterSale 函数', () => {
    beforeEach(() => {
        mockDB.afterSales = [];
    });

    /**
     * 无售后时返回 hasActive: false
     */
    test('无售后时返回 hasActive: false', () => {
        fc.assert(
            fc.property(
                subOrderIdArb,
                (subOrderId) => {
                    mockDB.afterSales = [];
                    
                    const result = hasActiveAfterSale(subOrderId);
                    
                    expect(result.hasActive).toBe(false);
                    expect(result.afterSaleId).toBeNull();
                    expect(result.afterSale).toBeNull();
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * 存在进行中售后时返回正确信息
     */
    test('存在进行中售后时返回正确信息', () => {
        const activeStatuses = [
            AFTERSALE_STATUS.PENDING,
            AFTERSALE_STATUS.APPROVED,
            AFTERSALE_STATUS.WAITING_RETURN,
            AFTERSALE_STATUS.RETURNING,
            AFTERSALE_STATUS.RECEIVED,
            AFTERSALE_STATUS.RESHIPPING
        ];

        fc.assert(
            fc.property(
                subOrderIdArb,
                fc.constantFrom(...activeStatuses),
                (subOrderId, status) => {
                    const afterSale = {
                        id: 'AS0001',
                        subOrderId: subOrderId,
                        status: status
                    };
                    mockDB.afterSales = [afterSale];
                    
                    const result = hasActiveAfterSale(subOrderId);
                    
                    expect(result.hasActive).toBe(true);
                    expect(result.afterSaleId).toBe('AS0001');
                    expect(result.afterSale).toEqual(afterSale);
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * null或空subOrderId返回 hasActive: false
     */
    test('null或空subOrderId返回 hasActive: false', () => {
        expect(hasActiveAfterSale(null).hasActive).toBe(false);
        expect(hasActiveAfterSale('').hasActive).toBe(false);
        expect(hasActiveAfterSale(undefined).hasActive).toBe(false);
    });
});

// ==================== 边界情况测试 ====================

describe('边界情况', () => {
    beforeEach(() => {
        mockDB.afterSales = [];
    });

    /**
     * 签收时间正好是15天前（边界值）
     */
    test('签收时间正好是15天前可以申请', () => {
        const deliverDate = new Date();
        deliverDate.setDate(deliverDate.getDate() - 15);
        
        const subOrder = {
            id: 'SO0001',
            status: 'delivered',
            deliverTime: deliverDate.toISOString()
        };
        
        const result = canApplyAfterSale(subOrder, null);
        
        expect(result.canApply).toBe(true);
    });

    /**
     * 签收时间是16天前（刚超过边界）
     */
    test('签收时间是16天前不能申请', () => {
        const deliverDate = new Date();
        deliverDate.setDate(deliverDate.getDate() - 16);
        
        const subOrder = {
            id: 'SO0001',
            status: 'delivered',
            deliverTime: deliverDate.toISOString()
        };
        
        const result = canApplyAfterSale(subOrder, null);
        
        expect(result.canApply).toBe(false);
    });

    /**
     * 已签收但无签收时间（异常数据）
     */
    test('已签收但无签收时间仍可申请', () => {
        const subOrder = {
            id: 'SO0001',
            status: 'delivered',
            deliverTime: null
        };
        
        const result = canApplyAfterSale(subOrder, null);
        
        // 无签收时间时不检查时效，允许申请
        expect(result.canApply).toBe(true);
    });

    /**
     * 多个售后单，只有一个进行中
     */
    test('多个售后单只有一个进行中时不能申请', () => {
        mockDB.afterSales = [
            { id: 'AS0001', subOrderId: 'SO0001', status: AFTERSALE_STATUS.COMPLETED },
            { id: 'AS0002', subOrderId: 'SO0001', status: AFTERSALE_STATUS.REJECTED },
            { id: 'AS0003', subOrderId: 'SO0001', status: AFTERSALE_STATUS.PENDING }
        ];
        
        const subOrder = {
            id: 'SO0001',
            status: 'shipped',
            deliverTime: null
        };
        
        const result = canApplyAfterSale(subOrder, null);
        
        expect(result.canApply).toBe(false);
        expect(result.activeAfterSaleId).toBe('AS0003');
    });

    /**
     * 多个售后单全部已完成时可以申请
     */
    test('多个售后单全部已完成时可以申请', () => {
        mockDB.afterSales = [
            { id: 'AS0001', subOrderId: 'SO0001', status: AFTERSALE_STATUS.COMPLETED },
            { id: 'AS0002', subOrderId: 'SO0001', status: AFTERSALE_STATUS.REJECTED },
            { id: 'AS0003', subOrderId: 'SO0001', status: AFTERSALE_STATUS.COMPLETED }
        ];
        
        const subOrder = {
            id: 'SO0001',
            status: 'shipped',
            deliverTime: null
        };
        
        const result = canApplyAfterSale(subOrder, null);
        
        expect(result.canApply).toBe(true);
    });
});
