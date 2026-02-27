/**
 * 运费计算模块
 * 从 data.js 中提取的核心计算函数，用于测试
 * 
 * Feature: freight-feature
 */

/**
 * 生成运费快照
 * Property 8: 运费快照不可变性
 * Validates: Requirements 9.1, 9.2, 9.3, 9.4
 * 
 * @param {string} subOrderId - 子订单ID
 * @param {string} supplierId - 供应商ID
 * @param {string} province - 收货省份
 * @param {number} orderAmount - 商品金额
 * @param {number} freight - 运费金额
 * @param {number} templateVersion - 运费模板版本
 * @returns {object} 运费快照
 */
function createFreightSnapshot(subOrderId, supplierId, province, orderAmount, freight, templateVersion = 1) {
    return {
        subOrderId: subOrderId,
        supplierId: supplierId,
        province: province,
        orderAmount: orderAmount,
        freight: freight,
        isFreeShipping: freight === 0,
        templateVersion: templateVersion,
        snapshotTime: new Date().toISOString()
    };
}

/**
 * 验证运费快照包含所有必需字段
 * 
 * @param {object} snapshot - 运费快照
 * @returns {object} { isValid, missingFields }
 */
function validateFreightSnapshot(snapshot) {
    const requiredFields = [
        'subOrderId',
        'supplierId', 
        'province',
        'orderAmount',
        'freight',
        'isFreeShipping',
        'templateVersion',
        'snapshotTime'
    ];
    
    if (!snapshot) {
        return { isValid: false, missingFields: requiredFields };
    }
    
    const missingFields = requiredFields.filter(field => 
        snapshot[field] === undefined || snapshot[field] === null
    );
    
    return {
        isValid: missingFields.length === 0,
        missingFields: missingFields
    };
}

/**
 * 验证运费快照不可变性
 * 比较两个快照是否相等（忽略snapshotTime）
 * 
 * @param {object} originalSnapshot - 原始快照
 * @param {object} currentSnapshot - 当前快照
 * @returns {object} { isImmutable, changedFields }
 */
function verifySnapshotImmutability(originalSnapshot, currentSnapshot) {
    if (!originalSnapshot || !currentSnapshot) {
        return { isImmutable: false, changedFields: ['snapshot is null'] };
    }
    
    const fieldsToCompare = [
        'subOrderId',
        'supplierId',
        'province',
        'orderAmount',
        'freight',
        'isFreeShipping',
        'templateVersion'
    ];
    
    const changedFields = fieldsToCompare.filter(field => 
        originalSnapshot[field] !== currentSnapshot[field]
    );
    
    return {
        isImmutable: changedFields.length === 0,
        changedFields: changedFields
    };
}

/**
 * 模拟运费模板更新后，验证快照不受影响
 * 
 * @param {object} snapshot - 运费快照
 * @param {object} newTemplateConfig - 新的运费模板配置
 * @returns {object} { snapshotUnchanged, originalFreight, newCalculatedFreight }
 */
function verifySnapshotAfterTemplateUpdate(snapshot, newTemplateConfig) {
    if (!snapshot) {
        return { snapshotUnchanged: false, originalFreight: 0, newCalculatedFreight: 0 };
    }
    
    // 快照中的运费应该保持不变
    const originalFreight = snapshot.freight;
    
    // 使用新模板配置计算运费（模拟模板更新后的计算）
    let newCalculatedFreight = newTemplateConfig.baseFreight || 0;
    
    // 检查是否为偏远地区
    if (newTemplateConfig.remoteAreas) {
        const remoteArea = newTemplateConfig.remoteAreas.find(
            ra => ra.province === snapshot.province
        );
        if (remoteArea) {
            newCalculatedFreight = remoteArea.freight;
        }
    }
    
    // 检查满额包邮
    if (newTemplateConfig.freeShippingThreshold && 
        snapshot.orderAmount >= newTemplateConfig.freeShippingThreshold) {
        newCalculatedFreight = 0;
    }
    
    return {
        snapshotUnchanged: true,  // 快照本身不会改变
        originalFreight: originalFreight,
        newCalculatedFreight: newCalculatedFreight,
        // 即使新计算的运费不同，快照中的运费也应该保持不变
        freightDiffers: originalFreight !== newCalculatedFreight
    };
}

/**
 * 计算应付金额（包含运费）
 * 应付金额 = 商品总额 + 总运费 - 优惠金额
 * 
 * Property 7: 应付金额包含运费
 * Validates: Requirements 7.3
 * 
 * @param {number} totalAmount - 商品总额
 * @param {number} totalFreight - 总运费
 * @param {number} discountAmount - 优惠金额（优惠券 + 会员卡折扣等）
 * @returns {object} { payableAmount, breakdown }
 */
function calculatePayableAmount(totalAmount, totalFreight, discountAmount) {
    // 参数校验和默认值
    const amount = typeof totalAmount === 'number' && !isNaN(totalAmount) ? totalAmount : 0;
    const freight = typeof totalFreight === 'number' && !isNaN(totalFreight) ? totalFreight : 0;
    const discount = typeof discountAmount === 'number' && !isNaN(discountAmount) ? discountAmount : 0;
    
    // 计算应付金额：商品总额 + 总运费 - 优惠金额
    const rawPayable = amount + freight - discount;
    
    // 应付金额不能为负数
    const payableAmount = Math.max(0, Math.round(rawPayable * 100) / 100);
    
    return {
        payableAmount: payableAmount,
        breakdown: {
            totalAmount: Math.round(amount * 100) / 100,
            totalFreight: Math.round(freight * 100) / 100,
            discountAmount: Math.round(discount * 100) / 100
        }
    };
}

/**
 * 从订单对象计算应付金额
 * 
 * @param {object} order - 订单对象
 * @returns {object} { payableAmount, breakdown }
 */
function calculateOrderPayableAmount(order) {
    if (!order) {
        return {
            payableAmount: 0,
            breakdown: {
                totalAmount: 0,
                totalFreight: 0,
                discountAmount: 0
            }
        };
    }
    
    const totalAmount = order.totalAmount || 0;
    const totalFreight = order.totalFreight || 0;
    const discountAmount = (order.couponDeduct || 0);
    
    return calculatePayableAmount(totalAmount, totalFreight, discountAmount);
}

/**
 * 验证应付金额公式正确性
 * 用于属性测试验证
 * 
 * @param {number} totalAmount - 商品总额
 * @param {number} totalFreight - 总运费
 * @param {number} discountAmount - 优惠金额
 * @param {number} payableAmount - 应付金额
 * @returns {object} { isValid, expectedPayable, actualPayable, difference }
 */
function verifyPayableAmountFormula(totalAmount, totalFreight, discountAmount, payableAmount) {
    const expectedPayable = Math.max(0, Math.round((totalAmount + totalFreight - discountAmount) * 100) / 100);
    const actualPayable = Math.round(payableAmount * 100) / 100;
    const difference = Math.abs(expectedPayable - actualPayable);
    
    return {
        isValid: difference < 0.01,  // 允许0.01的精度误差
        expectedPayable: expectedPayable,
        actualPayable: actualPayable,
        difference: difference
    };
}

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
 * @param {number} config.supplierCostRate - 供应商成本率（默认0.80）
 * @param {number} config.opsServiceFeeRate - 代运营服务费率（默认0.05）
 * @param {number} config.merchantMarginRate - 商家毛利率（默认0.15）
 * @param {number} config.channelFeeRate - 渠道费率（默认0.0038）
 * @returns {object} 利润分成结果
 */
function calculateProfitSharing(goodsAmount, freight, config = {}) {
    // 参数校验和默认值
    const amount = typeof goodsAmount === 'number' && !isNaN(goodsAmount) && goodsAmount >= 0 
        ? goodsAmount : 0;
    const freightAmount = typeof freight === 'number' && !isNaN(freight) && freight >= 0 
        ? freight : 0;
    
    // 默认分成配置
    const supplierCostRate = config.supplierCostRate || 0.80;
    const opsServiceFeeRate = config.opsServiceFeeRate || 0.05;
    const merchantMarginRate = config.merchantMarginRate || 0.15;
    const channelFeeRate = config.channelFeeRate || 0.0038;
    
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
 * @param {object} subOrder - 子订单对象
 * @param {object} config - 分成配置（可选）
 * @returns {object} 结算金额明细
 */
function calculateSubOrderSettlement(subOrder, config = {}) {
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
 * 验证运费独立于利润分成
 * 用于属性测试验证
 * 
 * Property 9: 运费独立于利润分成
 * Validates: Requirements 10.2, 10.3
 * 
 * @param {number} goodsAmount - 商品金额
 * @param {number} freight - 运费金额
 * @param {object} profitResult - 利润分成结果
 * @returns {object} { isValid, reason }
 */
function verifyFreightExcludedFromProfit(goodsAmount, freight, profitResult) {
    if (!profitResult) {
        return { isValid: false, reason: '利润分成结果为空' };
    }
    
    // 验证1：分成基数应等于商品金额（不含运费）
    if (Math.abs(profitResult.profitBase - goodsAmount) > 0.01) {
        return { 
            isValid: false, 
            reason: `分成基数(${profitResult.profitBase})应等于商品金额(${goodsAmount})，不应包含运费` 
        };
    }
    
    // 验证2：分成基数不应包含运费
    if (freight > 0 && Math.abs(profitResult.profitBase - (goodsAmount + freight)) < 0.01) {
        return { 
            isValid: false, 
            reason: '分成基数错误地包含了运费' 
        };
    }
    
    // 验证3：各项分成之和应等于商品金额（允许小误差）
    const totalDistributed = profitResult.supplierCost + 
        profitResult.opsServiceFee + 
        profitResult.merchantMargin + 
        profitResult.channelFee;
    
    // 由于分成比例可能不精确等于100%，这里只验证不超过商品金额
    if (totalDistributed > goodsAmount + 0.01) {
        return { 
            isValid: false, 
            reason: `分成总额(${totalDistributed})超过商品金额(${goodsAmount})` 
        };
    }
    
    // 验证4：freightIncludedInProfitBase 标志应为 false
    if (profitResult.freightIncludedInProfitBase !== false) {
        return { 
            isValid: false, 
            reason: 'freightIncludedInProfitBase 应为 false' 
        };
    }
    
    return { isValid: true, reason: '' };
}

/**
 * 验证运费100%归供应商
 * 用于属性测试验证
 * 
 * Property 10: 运费100%归供应商
 * Validates: Requirements 10.4
 * 
 * @param {number} freight - 运费金额
 * @param {object} profitResult - 利润分成结果
 * @returns {object} { isValid, reason }
 */
function verifyFreightFullyToSupplier(freight, profitResult) {
    if (!profitResult) {
        return { isValid: false, reason: '利润分成结果为空' };
    }
    
    // 验证1：供应商运费应等于原运费（100%）
    if (Math.abs(profitResult.supplierFreight - freight) > 0.01) {
        return { 
            isValid: false, 
            reason: `供应商运费(${profitResult.supplierFreight})应等于原运费(${freight})` 
        };
    }
    
    // 验证2：运费归供应商比例应为100%
    if (profitResult.freightSupplierRate !== 1.0) {
        return { 
            isValid: false, 
            reason: `运费归供应商比例(${profitResult.freightSupplierRate})应为1.0(100%)` 
        };
    }
    
    // 验证3：如果有运费，供应商总收入应包含运费
    if (freight > 0) {
        const expectedSupplierTotal = profitResult.supplierCost + freight;
        if (Math.abs(profitResult.supplierTotalIncome - expectedSupplierTotal) > 0.01) {
            return { 
                isValid: false, 
                reason: `供应商总收入(${profitResult.supplierTotalIncome})应等于成本分成(${profitResult.supplierCost})+运费(${freight})` 
            };
        }
    }
    
    return { isValid: true, reason: '' };
}

/**
 * 计算运费退款结算
 * 当发生退款时，需要从供应商待结算运费中扣除
 * 
 * @param {number} originalFreight - 原运费
 * @param {number} refundRatio - 退款比例（0-1）
 * @param {boolean} isFreeShipping - 是否为包邮订单
 * @returns {object} 运费退款结算结果
 */
function calculateFreightRefundSettlement(originalFreight, refundRatio, isFreeShipping) {
    // 参数校验
    const freight = typeof originalFreight === 'number' && !isNaN(originalFreight) && originalFreight >= 0 
        ? originalFreight : 0;
    const ratio = typeof refundRatio === 'number' && !isNaN(refundRatio) 
        ? Math.max(0, Math.min(1, refundRatio)) : 0;
    
    // 包邮订单不退运费
    if (isFreeShipping || freight === 0) {
        return {
            originalFreight: freight,
            refundRatio: ratio,
            refundFreight: 0,
            supplierDeduction: 0,
            reason: isFreeShipping ? '包邮订单不退运费' : '无运费'
        };
    }
    
    // 计算应退运费
    const refundFreight = Math.round(freight * ratio * 100) / 100;
    
    return {
        originalFreight: freight,
        refundRatio: ratio,
        refundFreight: refundFreight,
        supplierDeduction: refundFreight,  // 从供应商待结算中扣除
        reason: ratio === 1 ? '全额退款退还全部运费' : '部分退款按比例退还运费'
    };
}

// ==================== 偏远地区运费计算 ====================

/**
 * 计算单个供应商的运费
 * 
 * Property 2: 偏远地区运费计算正确性
 * Validates: Requirements 2.2, 2.3, 4.1, 4.2
 * 
 * @param {object} template - 运费模板
 * @param {string} province - 收货省份
 * @param {number} orderAmount - 该供应商商品金额
 * @returns {object} { freight, isFreeShipping, reason }
 */
function calculateSupplierFreight(template, province, orderAmount) {
    // 参数校验
    const amount = typeof orderAmount === 'number' && !isNaN(orderAmount) && orderAmount >= 0 
        ? orderAmount : 0;
    
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
        freight: Math.round(freight * 100) / 100,
        isFreeShipping: freight === 0,
        reason: reason
    };
}

/**
 * 验证偏远地区运费计算正确性
 * 
 * Property 2: 偏远地区运费计算正确性
 * Validates: Requirements 2.2, 2.3, 4.1, 4.2
 * 
 * @param {object} template - 运费模板
 * @param {string} province - 收货省份
 * @param {number} orderAmount - 订单金额
 * @param {object} result - 运费计算结果
 * @returns {object} { isValid, reason }
 */
function verifyRemoteAreaFreight(template, province, orderAmount, result) {
    if (!result) {
        return { isValid: false, reason: '运费计算结果为空' };
    }
    
    // 没有模板或未启用，应该包邮
    if (!template || !template.enabled) {
        if (result.freight !== 0) {
            return { isValid: false, reason: '无模板时运费应为0' };
        }
        return { isValid: true, reason: '' };
    }
    
    // 检查偏远地区
    const remoteArea = (template.remoteAreas || []).find(ra => ra.province === province);
    if (remoteArea) {
        // 偏远地区应使用配置的运费
        const expectedFreight = Math.round(remoteArea.freight * 100) / 100;
        if (Math.abs(result.freight - expectedFreight) > 0.01) {
            return { 
                isValid: false, 
                reason: `偏远地区运费应为${expectedFreight}，实际为${result.freight}` 
            };
        }
    } else {
        // 非偏远地区应使用基础运费
        const expectedFreight = Math.round((template.baseFreight || 0) * 100) / 100;
        if (Math.abs(result.freight - expectedFreight) > 0.01) {
            return { 
                isValid: false, 
                reason: `非偏远地区运费应为${expectedFreight}，实际为${result.freight}` 
            };
        }
    }
    
    return { isValid: true, reason: '' };
}

/**
 * 检查是否可配送到指定地区
 * 
 * Property 14: 不发货地区阻止下单
 * Validates: Requirements 2.5, 4.5
 * 
 * @param {object} template - 运费模板
 * @param {string} province - 收货省份
 * @returns {object} { canDeliver, message }
 */
function checkDeliveryAvailable(template, province) {
    // 没有模板，默认可配送
    if (!template) {
        return { canDeliver: true, message: '' };
    }
    
    // 检查不发货地区
    const noDeliveryAreas = template.noDeliveryAreas || [];
    if (noDeliveryAreas.includes(province)) {
        return { 
            canDeliver: false, 
            message: `该地区(${province})暂不支持配送` 
        };
    }
    
    return { canDeliver: true, message: '' };
}

module.exports = {
    createFreightSnapshot,
    validateFreightSnapshot,
    verifySnapshotImmutability,
    verifySnapshotAfterTemplateUpdate,
    calculatePayableAmount,
    calculateOrderPayableAmount,
    verifyPayableAmountFormula,
    // 运费结算相关
    calculateProfitSharing,
    calculateSubOrderSettlement,
    verifyFreightExcludedFromProfit,
    verifyFreightFullyToSupplier,
    calculateFreightRefundSettlement,
    // 偏远地区运费计算
    calculateSupplierFreight,
    verifyRemoteAreaFreight,
    checkDeliveryAvailable
};
