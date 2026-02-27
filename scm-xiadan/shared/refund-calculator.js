/**
 * 退款金额计算模块
 * 从 data.js 中提取的核心计算函数，用于测试
 */

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

/**
 * 计算运费退款金额
 * 
 * 运费退款规则（Requirements 12.1, 12.2, 12.3, 12.4）：
 * - 待发货状态退款：退还该子订单对应的全部运费（商品未发出，无物流成本）
 * - 已发货状态退款：不退还运费（物流已产生成本，需支付给供应商）
 * - 包邮订单：不退还运费（原运费为0）
 * 
 * @param {object} subOrder - 子订单对象（包含freight、freightSnapshot和status字段）
 * @param {array} refundItems - 退款商品列表 [{ productId, qty }]
 * @returns {object} { originalFreight, refundFreight, refundRatio, isFreeShipping, reason }
 */
function calculateFreightRefund(subOrder, refundItems) {
    // 参数校验
    if (!subOrder || !refundItems || refundItems.length === 0) {
        return {
            originalFreight: 0,
            refundFreight: 0,
            refundRatio: 0,
            isFreeShipping: false,
            reason: '无效的退款请求'
        };
    }
    
    // 获取子订单运费（从freightSnapshot或freight字段获取）
    const originalFreight = subOrder.freightSnapshot 
        ? (subOrder.freightSnapshot.freight || 0)
        : (subOrder.freight || 0);
    
    // 判断是否为包邮订单
    const isFreeShipping = subOrder.freightSnapshot 
        ? (subOrder.freightSnapshot.isFreeShipping === true)
        : (originalFreight === 0);
    
    // 包邮订单不退运费（Requirements 12.3）
    if (isFreeShipping || originalFreight === 0) {
        return {
            originalFreight: originalFreight,
            refundFreight: 0,
            refundRatio: 0,
            isFreeShipping: true,
            reason: '包邮订单不退运费'
        };
    }
    
    // 检查发货状态：已发货状态不退运费
    // 已发货状态包括：shipped（已发货）、delivered（已签收）、partial_shipped（部分发货）
    const shippedStatuses = ['shipped', 'delivered', 'partial_shipped'];
    const isShipped = shippedStatuses.includes(subOrder.status);
    
    if (isShipped) {
        return {
            originalFreight: Math.round(originalFreight * 100) / 100,
            refundFreight: 0,
            refundRatio: 0,
            isFreeShipping: false,
            reason: '已发货订单不退运费（物流成本已产生）'
        };
    }
    
    // 待发货状态：退还全部运费
    // 待发货状态包括：pending_ship（待发货）
    return {
        originalFreight: Math.round(originalFreight * 100) / 100,
        refundFreight: Math.round(originalFreight * 100) / 100,
        refundRatio: 1,
        isFreeShipping: false,
        reason: '待发货订单退还全部运费'
    };
}

/**
 * 计算完整的退款信息（包含运费）
 * 
 * @param {object} subOrder - 子订单对象
 * @param {array} refundItems - 退款商品列表 [{ productId, qty }]
 * @returns {object} 完整的退款信息（包含运费退款）
 */
function calculateFullRefundInfoWithFreight(subOrder, refundItems) {
    // 计算商品退款金额
    const amountInfo = calculateRefundAmount(subOrder, refundItems);
    
    // 计算退款明细
    const detailInfo = calculateRefundDetail(subOrder, amountInfo.refundAmount, amountInfo.itemsAmount);
    
    // 计算运费退款
    const freightInfo = calculateFreightRefund(subOrder, refundItems);
    
    // 总退款金额 = 商品退款 + 运费退款
    const totalRefundAmount = Math.round((amountInfo.refundAmount + freightInfo.refundFreight) * 100) / 100;
    
    return {
        // 商品金额信息
        itemsAmount: amountInfo.itemsAmount,
        discountAmount: amountInfo.discountAmount,
        goodsRefundAmount: amountInfo.refundAmount,  // 商品退款金额
        
        // 运费退款信息
        originalFreight: freightInfo.originalFreight,
        freightRefundAmount: freightInfo.refundFreight,
        freightRefundRatio: freightInfo.refundRatio,
        isFreeShipping: freightInfo.isFreeShipping,
        freightRefundReason: freightInfo.reason,
        
        // 总退款金额（商品 + 运费）
        totalRefundAmount: totalRefundAmount,
        
        // 退款明细（按支付方式）
        refundPointsAmount: detailInfo.refundPointsAmount,
        refundCardAmount: detailInfo.refundCardAmount,
        refundCashAmount: detailInfo.refundCashAmount,
        
        // 积分换算（100积分=1元）
        refundPoints: Math.round(detailInfo.refundPointsAmount * 100)
    };
}

/**
 * 计算推广员佣金退款（V2.0）
 * 
 * V2.0 推广员佣金退款规则：
 * - 推广员佣金结算时机由分销系统配置决定
 * - 退款时根据分账状态判断：
 *   - 分账冻结中：直接从冻结金额中扣除
 *   - 分账已解冻：从推广员余额账户扣除（可为负）
 * 
 * @param {object} subOrder - 子订单对象（包含 items[].clearing 字段）
 * @param {array} refundItems - 退款商品列表 [{ productId, qty }]
 * @param {string} clearingStatus - 清分状态：'frozen'=冻结中, 'settled'=已结算
 * @returns {object} 推广员佣金退款信息
 */
function calculatePromoterCommissionRefund(subOrder, refundItems, clearingStatus = 'frozen') {
    // 参数校验
    if (!subOrder || !refundItems || refundItems.length === 0) {
        return {
            directCommissionRefund: 0,
            indirectCommissionRefund: 0,
            totalCommissionRefund: 0,
            refundMethod: 'none',
            reason: '无效的退款请求'
        };
    }
    
    // 优先使用 SKU 级别的清分数据（V2.0）
    let directCommissionRefund = 0;
    let indirectCommissionRefund = 0;
    let originalDirectCommission = 0;
    let originalIndirectCommission = 0;
    let hasSkuClearing = false;
    
    refundItems.forEach(refundItem => {
        const orderItem = subOrder.items.find(oi => oi.productId === refundItem.productId);
        if (!orderItem) return;
        
        // 计算退款数量占该 SKU 总数量的比例
        const qtyRatio = orderItem.qty > 0 ? refundItem.qty / orderItem.qty : 0;
        
        if (orderItem.clearing) {
            // 使用 SKU 级别的清分数据
            hasSkuClearing = true;
            directCommissionRefund += (orderItem.clearing.directCommission || 0) * qtyRatio;
            indirectCommissionRefund += (orderItem.clearing.indirectCommission || 0) * qtyRatio;
            originalDirectCommission += orderItem.clearing.directCommission || 0;
            originalIndirectCommission += orderItem.clearing.indirectCommission || 0;
        }
    });
    
    // 如果没有 SKU 级别清分数据，尝试使用子订单级别清分数据按比例分摊
    if (!hasSkuClearing && subOrder.clearing) {
        const subOrderTotal = subOrder.items.reduce((sum, item) => sum + item.price * item.qty, 0);
        const refundItemsTotal = refundItems.reduce((sum, item) => {
            const orderItem = subOrder.items.find(oi => oi.productId === item.productId);
            if (!orderItem) return sum;
            return sum + orderItem.price * item.qty;
        }, 0);
        const ratio = subOrderTotal > 0 ? refundItemsTotal / subOrderTotal : 0;
        
        directCommissionRefund = Math.round((subOrder.clearing.directCommission || 0) * ratio * 100) / 100;
        indirectCommissionRefund = Math.round((subOrder.clearing.indirectCommission || 0) * ratio * 100) / 100;
        originalDirectCommission = subOrder.clearing.directCommission || 0;
        originalIndirectCommission = subOrder.clearing.indirectCommission || 0;
    }
    
    // 如果没有任何清分数据
    if (!hasSkuClearing && !subOrder.clearing) {
        return {
            directCommissionRefund: 0,
            indirectCommissionRefund: 0,
            totalCommissionRefund: 0,
            refundMethod: 'none',
            reason: '无清分数据'
        };
    }
    
    // 四舍五入
    directCommissionRefund = Math.round(directCommissionRefund * 100) / 100;
    indirectCommissionRefund = Math.round(indirectCommissionRefund * 100) / 100;
    const totalCommissionRefund = Math.round((directCommissionRefund + indirectCommissionRefund) * 100) / 100;
    
    // 根据清分状态确定退款方式
    let refundMethod, reason;
    if (clearingStatus === 'frozen') {
        refundMethod = 'deduct_frozen';
        reason = '从冻结金额中扣除';
    } else {
        refundMethod = 'deduct_balance';
        reason = '从推广员余额账户扣除（可为负）';
    }
    
    return {
        directCommissionRefund,
        indirectCommissionRefund,
        totalCommissionRefund,
        refundMethod,
        reason,
        // 详细信息
        originalDirectCommission,
        originalIndirectCommission,
        hasSkuClearing  // 标记是否使用了 SKU 级别清分数据
    };
}

module.exports = {
    calculateRefundAmount,
    calculateRefundDetail,
    calculateFullRefundInfo,
    calculateFreightRefund,
    calculateFullRefundInfoWithFreight,
    calculatePromoterCommissionRefund
};
