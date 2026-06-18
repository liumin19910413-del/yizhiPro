// 产品文档数据 - 按页面组织
// 供前后端工程师、测试人员参考

const PageDocs = {
    // ==================== Lite商户端文档 ====================
    'lite': {
        'marketing-apps': {
            title: '营销应用',
            content: `
                <h4>页面说明</h4>
                <p>营销应用是Lite商户后台的核心功能入口，展示所有可用的营销工具和服务。商户可以在此查看和进入已开通的应用。</p>
                
                <h4>页面内容（2026-01-22 简化）</h4>
                <ul>
                    <li><strong>页面标题</strong>：营销应用</li>
                    <li><strong>应用卡片</strong>：店商供应链应用卡片</li>
                </ul>
                
                <div class="note">
                    <p><strong>⚠️ 2026-01-22 更新：</strong></p>
                    <p>• 已去掉"营销应用为您提供多种营销工具和服务..."的说明卡片</p>
                    <p>• 已去掉"🎉 店商供应链已开通"的成功提示卡片</p>
                    <p>• 已去掉"⏳ 店商供应链申请进行中"的进度提示卡片</p>
                    <p>• 已去掉"🚀 开通店商供应链"的引导卡片</p>
                    <p>• 页面更简洁，只保留应用卡片网格</p>
                </div>
                
                <h4>功能模块</h4>
                <ul>
                    <li><strong>店商供应链</strong>：一站式供应链解决方案，提供商品代发、库存管理、订单处理等服务</li>
                </ul>
                
                <h4>应用状态说明</h4>
                <table class="doc-table">
                    <tr><th>状态</th><th>含义</th><th>操作</th></tr>
                    <tr><td>已开通</td><td>有已签约的入驻申请</td><td>点击进入应用管理</td></tr>
                    <tr><td>未开通</td><td>无任何申请记录</td><td>点击申请入驻</td></tr>
                    <tr><td>申请中</td><td>有待审核的申请</td><td>点击查看进度</td></tr>
                    <tr><td>待签署协议</td><td>审核通过待签约</td><td>点击去签署</td></tr>
                </table>
                
                <h4>判断逻辑</h4>
                <div class="note">
                    <p>1. 查询当前商户号(currentMerchantId)的所有申请记录</p>
                    <p>2. 如果存在status='signed'的记录 → 已开通</p>
                    <p>3. 如果存在status='pending_sign'的记录 → 待签署协议</p>
                    <p>4. 如果有任何申请记录 → 申请中</p>
                    <p>5. 否则 → 未开通</p>
                </div>
                
                <h4>关联数据表</h4>
                <ul>
                    <li><strong>applications</strong>：入驻申请表，字段merchantId关联当前商户</li>
                </ul>
            `
        },

        'dashboard': {
            title: '工作台',
            content: `
                <h4>页面说明</h4>
                <p>商户的综合信息展示页面，提供快捷操作入口和业务概览。</p>
                
                <h4>展示内容</h4>
                <table class="doc-table">
                    <tr><th>字段</th><th>数据来源</th><th>说明</th></tr>
                    <tr><td>商户名称</td><td>merchants.name</td><td>当前登录商户名称</td></tr>
                    <tr><td>商户号</td><td>merchants.id</td><td>伊智付商户号</td></tr>
                    <tr><td>营业执照</td><td>merchants.companyName</td><td>公司/个体户名称</td></tr>
                    <tr><td>账户类型</td><td>merchants.type</td><td>company=企业, individual=个体户</td></tr>
                    <tr><td>已开通应用</td><td>applications</td><td>status='signed'的数量</td></tr>
                </table>
                
                <h4>快捷操作</h4>
                <ul>
                    <li>营销应用 - 跳转到营销应用列表</li>
                    <li>店商供应链 - 进入供应链应用（已开通时）或申请入驻（未开通时）</li>
                    <li>商户信息 - 查看商户详细信息</li>
                    <li>系统设置 - 账户和通知设置</li>
                </ul>
            `
        },

        'merchant-info': {
            title: '商户信息',
            content: `
                <h4>页面说明</h4>
                <p>展示当前登录商户的详细信息，数据来源于merchants表。</p>
                
                <h4>字段对照表</h4>
                <table class="doc-table">
                    <tr><th>显示名称</th><th>字段名</th><th>类型</th><th>说明</th></tr>
                    <tr><td>商户号</td><td>id</td><td>String</td><td>伊智付商户号，格式YZFyyyymmXXX</td></tr>
                    <tr><td>商户名称</td><td>name</td><td>String</td><td>商户简称</td></tr>
                    <tr><td>公司名称</td><td>companyName</td><td>String</td><td>营业执照上的公司全称</td></tr>
                    <tr><td>营业执照号</td><td>businessLicense</td><td>String</td><td>统一社会信用代码</td></tr>
                    <tr><td>账户类型</td><td>type</td><td>Enum</td><td>company=企业账户, individual=个体户</td></tr>
                    <tr><td>经营范围</td><td>scope</td><td>String</td><td>营业执照经营范围，分号分隔</td></tr>
                    <tr><td>分账功能</td><td>hasSubAccount</td><td>Boolean</td><td>true=已开通, false=未开通</td></tr>
                    <tr><td>商城小程序</td><td>miniProgramId</td><td>String</td><td>绑定的小程序ID，null=未绑定</td></tr>
                    <tr><td>联系人</td><td>contactName</td><td>String</td><td>商户联系人姓名</td></tr>
                    <tr><td>联系电话</td><td>contactPhone</td><td>String</td><td>联系人手机号</td></tr>
                </table>
                
                <h4>业务规则</h4>
                <div class="tip">
                    <p>1. 入驻条件：hasSubAccount=true 且 scope包含"化妆品零售"或"化妆品销售"</p>
                    <p>2. 只有miniProgramId不为空的商户号才能申请入驻</p>
                </div>
            `
        },

        'settings': {
            title: '系统设置',
            content: `
                <h4>页面说明</h4>
                <p>系统设置页面，管理账户安全和通知配置。</p>
                
                <h4>功能模块</h4>
                <ul>
                    <li><strong>账户设置</strong>：修改密码、绑定手机、登录日志</li>
                    <li><strong>通知设置</strong>：订单通知、系统通知、营销通知开关</li>
                </ul>
                
                <div class="note">当前为Demo演示，设置功能仅展示UI，不实际生效</div>
            `
        },

        'supply-chain-entry': {
            title: '入驻申请',
            content: `
                <h4>页面说明</h4>
                <p>店商供应链入驻申请页面，未开通的商户从这里开始申请入驻。</p>
                
                <h4>申请流程</h4>
                <div class="note">
                    <p><strong>步骤1：填写申请</strong> → 商户填写入驻信息</p>
                    <p><strong>步骤2：平台审核</strong> → MG端审核申请</p>
                    <p><strong>步骤3：签署协议</strong> → 商户签署合作协议</p>
                    <p><strong>步骤4：合作成功</strong> → 状态变为signed</p>
                </div>
                
                <h4>入驻条件（自动校验）</h4>
                <table class="doc-table">
                    <tr><th>条件</th><th>校验字段</th><th>要求</th></tr>
                    <tr><td>伊智付商户号</td><td>merchants.id</td><td>必须存在</td></tr>
                    <tr><td>分账功能</td><td>merchants.hasSubAccount</td><td>必须为true</td></tr>
                    <tr><td>经营范围</td><td>merchants.scope</td><td>包含"化妆品零售"或"化妆品销售"</td></tr>
                    <tr><td>商城小程序</td><td>merchants.miniProgramId</td><td>不为空</td></tr>
                </table>
                
                <h4>申请表单字段</h4>
                <table class="doc-table">
                    <tr><th>字段</th><th>必填</th><th>说明</th></tr>
                    <tr><td>伊智付商户号</td><td>是</td><td>下拉选择，只显示符合条件的商户号</td></tr>
                    <tr><td>申请人姓名</td><td>是</td><td>applicantName</td></tr>
                    <tr><td>申请人手机号</td><td>是</td><td>applicantPhone</td></tr>
                    <tr><td>品牌总部商户号</td><td>否</td><td>连锁商户需选择，brandMerchantId</td></tr>
                    <tr><td>分账接收方</td><td>否</td><td>连锁商户需选择，profitReceiverId</td></tr>
                    <tr><td>分走商户号的收益比例</td><td>否</td><td>连锁商户需设置，brandRatio，假设设置的是10%，那么此商户号收益100元，则分账接收方从中分走10元</td></tr>
                </table>
                
                <h4>连锁商户特殊说明</h4>
                <div class="tip">
                    <p><strong>分账接收方设置：</strong></p>
                    <p>1. 连锁商户申请时需要为每个商户号设置分账接收方</p>
                    <p>2. 分账接收方从品牌总部的分账接收方列表中选择</p>
                    <p>3. 需要设置"分走商户号的收益比例"，例如设置10%，则该商户号收益100元时，分账接收方分走10元</p>
                    <p>4. 待审批状态下，支持修改分账接收方和收益比例</p>
                    <p>5. 已拒绝重新提交时，也支持修改分账接收方和收益比例</p>
                </div>
                
                <h4>系统默认分账方（后台自动绑定）</h4>
                <div class="note">
                    <p><strong>⚠️ 重要说明：</strong></p>
                    <p>商家申请入驻时，后台系统会自动为每一个入驻商户号绑定两个默认分账方：</p>
                    <p>1. <strong>供应链平台分账方</strong>：接收供应链平台的收益分成</p>
                    <p>2. <strong>私域运营平台分账方</strong>：接收私域运营平台的收益分成</p>
                    <p>这两个默认分账方的具体商户号信息需要等后续合同出来时一起补充，但系统架构已预留此方案。</p>
                    <p>商家在前端申请时无需手动设置这两个分账方，系统会在后台自动完成绑定。</p>
                </div>
                
                <h4>提交后数据变化</h4>
                <div class="tip">
                    <p>1. 在applications表新增一条记录</p>
                    <p>2. status设为'pending'（待审核）</p>
                    <p>3. createTime设为当前时间</p>
                    <p>4. 连锁商户会记录profitReceiverId和brandRatio</p>
                    <p>5. 其他审核相关字段为null</p>
                </div>
            `
        },

        'supply-chain-dashboard': {
            title: '供应链工作台',
            content: `
                <h4>页面说明</h4>
                <p>店商供应链应用的工作台，展示业务概览数据和待处理事项。</p>
                
                <h4>数据统计卡片</h4>
                <table class="doc-table">
                    <tr><th>指标</th><th>数据来源</th><th>计算逻辑</th></tr>
                    <tr><td>待发货订单</td><td>orders</td><td>status='pending_ship' 且 merchantId=当前商户</td></tr>
                    <tr><td>可用保证金</td><td>deposits</td><td>availableDeposit字段</td></tr>
                    <tr><td>本月销售额</td><td>orders</td><td>本月已完成订单的totalAmount求和</td></tr>
                    <tr><td>待处理事项</td><td>-</td><td>待充值订单数 + 待签署协议数</td></tr>
                </table>
                
                <h4>快捷入口</h4>
                <ul>
                    <li>商品管理 - 查看可销售商品</li>
                    <li>保证金管理 - 充值和查看保证金</li>
                    <li>订单管理 - 处理订单</li>
                    <li>财务对账 - 查看收益明细</li>
                </ul>
            `
        },

        'supply-chain-apply': {
            title: '入驻管理',
            content: `
                <h4>页面说明</h4>
                <p>管理入驻申请记录，查看申请状态和处理相关操作。</p>
                
                <h4>搜索条件</h4>
                <table class="doc-table">
                    <tr><th>条件</th><th>字段</th><th>匹配方式</th></tr>
                    <tr><td>商户号</td><td>merchantId</td><td>模糊匹配（包含）</td></tr>
                </table>
                
                <h4>列表字段</h4>
                <table class="doc-table">
                    <tr><th>显示名称</th><th>字段名</th><th>说明</th></tr>
                    <tr><td>商户号</td><td>merchantId</td><td>伊智付商户号</td></tr>
                    <tr><td>商户名称</td><td>-</td><td>关联merchants.name</td></tr>
                    <tr><td>申请人</td><td>applicantName</td><td>申请人姓名</td></tr>
                    <tr><td>状态</td><td>status</td><td>见状态说明</td></tr>
                    <tr><td>申请时间</td><td>createTime</td><td>提交申请的时间</td></tr>
                </table>
                
                <div class="note">
                    <p><strong>⚠️ 2026-01-22 更新：</strong>已去掉"申请编号"字段，列表和详情弹窗中均不再显示。</p>
                </div>
                
                <h4>申请状态说明</h4>
                <table class="doc-table">
                    <tr><th>状态值</th><th>显示名称</th><th>可执行操作</th></tr>
                    <tr><td>pending</td><td>待审核</td><td>查看详情、分账设置</td></tr>
                    <tr><td>pending_sign</td><td>待签约</td><td>去签署、查看详情、分账设置</td></tr>
                    <tr><td>rejected</td><td>已拒绝</td><td>编辑资料（重新提交）、查看原因</td></tr>
                    <tr><td>signed</td><td>已签约</td><td>查看详情、分账设置</td></tr>
                    <tr><td>need_maintain</td><td>待重新维护</td><td>编辑资料</td></tr>
                </table>
                
                <h4>入驻申请流程（2026-01-22 简化）</h4>
                <div class="note">
                    <p><strong>1. 申请入口简化</strong></p>
                    <p>• 点击【申请入驻】按钮，直接进入"入驻申请"表单页面</p>
                    <p>• 已去掉"请您选择商户类型"的选择页面</p>
                    <p>• 弹窗标题统一为"入驻申请"</p>
                </div>
                
                <div class="note">
                    <p><strong>2. 申请表单简化</strong></p>
                    <p>• 选择伊智付商户号后，不再显示"商户号管理"表格</p>
                    <p>• 去掉了品牌总部分成比例设置</p>
                    <p>• 去掉了分账接收方选择</p>
                    <p>• 提交时默认：brandRatio=0, profitReceiverId=null</p>
                </div>
                
                <div class="note">
                    <p><strong>3. 编辑已拒绝申请简化</strong></p>
                    <p>• 去掉了"选择伊智付商户号"的复选框区域</p>
                    <p>• 去掉了"商户号管理"表格及分账设置</p>
                    <p>• 提交时默认：brandRatio=0, profitSettings=[]</p>
                </div>
                
                <div class="note">
                    <p><strong>4. 拒绝原因固定文案</strong></p>
                    <p>• 编辑资料弹窗和申请详情弹窗中的拒绝原因统一为：</p>
                    <p>"您申请的商户号营业执照的经营范围还未更新，请您按申请入驻时提醒你要的经营范围去工商进行变更，变更成功后再进行提交。"</p>
                </div>
                
                <h4>分账设置功能（2026-01-22 优化）</h4>
                <div class="tip">
                    <p><strong>1. 分账设置弹窗优化</strong></p>
                    <p>• 去掉了"品牌总部"信息显示</p>
                    <p>• 去掉了"💡 提示：总分成比例未达到100%"的提示（仅保留超过100%的警告）</p>
                    <p>• 可用分账接收方列表中去掉了"状态"列</p>
                </div>
                
                <div class="tip">
                    <p><strong>2. 新增分账接收方功能</strong></p>
                    <p>• 在"可用分账接收方列表"标题旁边新增"+ 新增分账接收方"按钮</p>
                    <p>• 点击后弹出"新增分账接收方"表单</p>
                    <p>• 支持两种账户类型：对公、对私</p>
                </div>
                
                <h4>新增分账接收方 - 对公账户</h4>
                <table class="doc-table">
                    <tr><th>字段名称</th><th>字段ID</th><th>必填</th><th>验证规则</th></tr>
                    <tr><td>分账接收方名称</td><td>receiverName</td><td>是</td><td>非空</td></tr>
                    <tr><td>联系手机号</td><td>contactPhone</td><td>是</td><td>11位手机号</td></tr>
                    <tr><td>营业执照编号</td><td>licenseNumber</td><td>是</td><td>非空</td></tr>
                    <tr><td>营业执照名称</td><td>licenseName</td><td>是</td><td>非空</td></tr>
                    <tr><td>营业执照照片</td><td>-</td><td>是</td><td>图片，≤2M</td></tr>
                    <tr><td>法人姓名</td><td>legalName</td><td>是</td><td>非空</td></tr>
                    <tr><td>法人身份证号</td><td>legalId</td><td>是</td><td>18位身份证号</td></tr>
                    <tr><td>法人身份证照片</td><td>-</td><td>是</td><td>人像面+国徽面，各≤2M</td></tr>
                    <tr><td>收款账户名称</td><td>accountName</td><td>否</td><td>-</td></tr>
                    <tr><td>收款账户行号</td><td>bankCode</td><td>否</td><td>-</td></tr>
                    <tr><td>收款账户卡号</td><td>bankAccount</td><td>否</td><td>-</td></tr>
                    <tr><td>银行卡照片</td><td>-</td><td>否</td><td>图片，≤2M</td></tr>
                    <tr><td>收款账户证件号</td><td>accountId</td><td>否</td><td>-</td></tr>
                    <tr><td>收款账户证件照片</td><td>-</td><td>是</td><td>人像面+国徽面，各≤2M</td></tr>
                </table>
                
                <h4>新增分账接收方 - 对私账户</h4>
                <table class="doc-table">
                    <tr><th>字段名称</th><th>字段ID</th><th>必填</th><th>验证规则</th></tr>
                    <tr><td>分账接收方名称</td><td>receiverName</td><td>是</td><td>非空</td></tr>
                    <tr><td>联系手机号</td><td>contactPhone</td><td>是</td><td>11位手机号</td></tr>
                    <tr><td>收款账户姓名</td><td>accountName</td><td>否</td><td>-</td></tr>
                    <tr><td>收款账户卡号</td><td>bankAccount</td><td>是</td><td>非空</td></tr>
                    <tr><td>收款账户证件号</td><td>accountId</td><td>是</td><td>18位身份证号</td></tr>
                    <tr><td>收款账户证件照片</td><td>-</td><td>是</td><td>人像面+国徽面，各≤2M</td></tr>
                </table>
                
                <div class="note">
                    <p><strong>文件上传规则：</strong></p>
                    <p>• 文件大小限制：2M</p>
                    <p>• 文件类型：仅支持图片格式</p>
                    <p>• 上传后显示预览，可点击"×"删除</p>
                    <p>• 超过大小限制时提示："文件大小不能超过2M"</p>
                </div>
                
                <div class="note">
                    <p><strong>提交验证：</strong></p>
                    <p>• 所有必填项必须填写</p>
                    <p>• 手机号格式：1开头的11位数字</p>
                    <p>• 身份证号格式：18位数字或17位数字+X</p>
                    <p>• 提交成功后显示："新增分账接收方成功"</p>
                    <p>• 自动刷新页面，新接收方出现在列表中</p>
                </div>
                
                <div class="tip">
                    <p><strong>数据存储：</strong></p>
                    <p>• 表名：profitReceivers</p>
                    <p>• ID格式：PR + 时间戳</p>
                    <p>• receiverType：'bank'（银行账户）</p>
                    <p>• accountType：'company'（对公）或 'personal'（对私）</p>
                    <p>• status：'active'（激活状态）</p>
                    <p>• merchantId：品牌总部商户号</p>
                </div>
                
                <h4>系统默认分账方（后台自动绑定）</h4>
                <div class="tip">
                    <p>⚠️ 重要说明：商家申请入驻时，后台系统会自动为每一个入驻商户号绑定两个默认分账方：</p>
                    <p>• <strong>供应链平台分账方</strong>：接收供应链平台的收益分成</p>
                    <p>• <strong>私域运营平台分账方</strong>：接收私域运营平台的收益分成</p>
                    <p>这两个默认分账方的具体商户号信息需要等后续合同出来时一起补充，但系统架构已预留此方案。</p>
                    <p>商家在前端申请时无需手动设置这两个分账方，系统会在后台自动完成绑定。</p>
                </div>
                
                <h4>协议签署流程</h4>
                <div class="tip">
                    <p><strong>签署规则：</strong></p>
                    <p>1. 文档展示 → 必须滚动到底部</p>
                    <p>2. 浏览时间 ≥ 10秒</p>
                    <p>3. 勾选"已阅读并确认签署"</p>
                    <p>4. 点击签署按钮</p>
                    <p>5. 需签署2份协议：电商代发协议、代运营合作协议</p>
                </div>
                
                <h4>签署日志记录</h4>
                <table class="doc-table">
                    <tr><th>字段</th><th>说明</th></tr>
                    <tr><td>signerAccount</td><td>签署人登录账号</td></tr>
                    <tr><td>signerPhone</td><td>账号绑定手机号</td></tr>
                    <tr><td>openTime</td><td>打开协议时间</td></tr>
                    <tr><td>readDuration</td><td>阅读时长（秒）</td></tr>
                    <tr><td>signTime</td><td>签署确认时间</td></tr>
                    <tr><td>ipAddress</td><td>操作IP地址</td></tr>
                    <tr><td>deviceInfo</td><td>设备信息</td></tr>
                </table>
                
                <h4>更新记录</h4>
                <div class="note">
                    <p><strong>2026-01-22 更新内容：</strong></p>
                    <p>1. 去掉申请编号字段（列表和详情）</p>
                    <p>2. 简化入驻申请流程（去掉商户类型选择、商户号管理）</p>
                    <p>3. 简化编辑已拒绝申请流程</p>
                    <p>4. 修改拒绝原因为固定文案</p>
                    <p>5. 优化分账设置弹窗（去掉品牌总部、100%提示、状态列）</p>
                    <p>6. 新增分账接收方功能（支持对公/对私账户）</p>
                </div>
            `
        },

        'supply-chain-goods': {
            title: '商品管理',
            content: `
                <h4>页面说明</h4>
                <p>查看可销售的供应链商品及利润信息。商品由MG端统一管理，商户只能查看不能编辑。</p>
                
                <h4>商品卡片字段</h4>
                <table class="doc-table">
                    <tr><th>显示名称</th><th>字段名</th><th>数据来源</th></tr>
                    <tr><td>商品封面</td><td>coverImg</td><td>goods表</td></tr>
                    <tr><td>SPU商品ID</td><td>id</td><td>goods表，格式SPUXXX</td></tr>
                    <tr><td>商品名称</td><td>name</td><td>goods表</td></tr>
                    <tr><td>销售价格</td><td>salePrice</td><td>goods表</td></tr>
                    <tr><td>商家利润</td><td>-</td><td>计算得出</td></tr>
                    <tr><td>更新时间</td><td>updateTime</td><td>goods表</td></tr>
                </table>
                
                <h4>利润计算公式</h4>
                <div class="note">
                    <p><strong>单店商家：</strong></p>
                    <p>商家利润 = (售价 - 手续费) × 商家分成比例</p>
                    <p><strong>连锁分店：</strong></p>
                    <p>商家利润 = (售价 - 手续费) × 商家分成比例 × (1 - 品牌总部分成比例)</p>
                </div>
                
                <h4>分成比例来源</h4>
                <table class="doc-table">
                    <tr><th>比例</th><th>字段</th><th>来源</th></tr>
                    <tr><td>商家分成比例</td><td>merchantRatio</td><td>applications表（已签约记录）</td></tr>
                    <tr><td>品牌总部分成比例</td><td>brandRatio</td><td>applications表</td></tr>
                    <tr><td>手续费率</td><td>-</td><td>固定0.6%</td></tr>
                </table>
                
                <h4>筛选条件</h4>
                <ul>
                    <li>只显示status='online'的商品</li>
                </ul>
            `
        },

        'supply-chain-deposit': {
            title: '保证金管理',
            content: `
                <h4>页面说明</h4>
                <p>管理保证金账户，查看余额和流水记录，进行充值操作。</p>
                
                <h4>保证金概览字段</h4>
                <table class="doc-table">
                    <tr><th>显示名称</th><th>字段名</th><th>说明</th></tr>
                    <tr><td>累计充值</td><td>totalDeposit</td><td>历史累计充值总额</td></tr>
                    <tr><td>可用保证金</td><td>availableDeposit</td><td>当前可用于订单的金额</td></tr>
                    <tr><td>冻结中</td><td>frozenDeposit</td><td>已用于订单但未结算的金额</td></tr>
                    <tr><td>已结算</td><td>settledDeposit</td><td>已完成结算的金额</td></tr>
                    <tr><td>需提现</td><td>needWithdrawDeposit</td><td>营业执照变更时需提现的金额</td></tr>
                </table>
                
                <h4>保证金流水类型</h4>
                <table class="doc-table">
                    <tr><th>类型值</th><th>显示名称</th><th>金额方向</th></tr>
                    <tr><td>recharge</td><td>充值</td><td>正数（增加）</td></tr>
                    <tr><td>freeze</td><td>冻结</td><td>负数（减少可用）</td></tr>
                    <tr><td>settle</td><td>结算</td><td>负数（从冻结转出）</td></tr>
                    <tr><td>withdraw</td><td>提现</td><td>负数（减少）</td></tr>
                </table>
                
                <h4>充值方式</h4>
                <table class="doc-table">
                    <tr><th>商户类型</th><th>可用方式</th></tr>
                    <tr><td>个体户(individual)</td><td>微信扫码、支付宝扫码、银行转账</td></tr>
                    <tr><td>公司(company)</td><td>仅支持公户银行转账</td></tr>
                </table>
                
                <h4>保证金计算逻辑</h4>
                <div class="tip">
                    <p><strong>场景1：消费者全额微信支付</strong></p>
                    <p>无需充值保证金，直接分账</p>
                    <p><strong>场景2：消费者非全额微信支付</strong></p>
                    <p>需充值保证金 = 总分账金额 - 可分账微信金额</p>
                    <p>分账优先级：品牌总部 > 私域运营平台 > 供应链平台</p>
                </div>
            `
        },

        'supply-chain-orders': {
            title: '订单管理',
            content: `
                <h4>页面说明</h4>
                <p>管理供应链订单，处理待充值订单，跟踪物流状态。</p>
                
                <h4>订单列表字段</h4>
                <table class="doc-table">
                    <tr><th>显示名称</th><th>字段名</th><th>说明</th></tr>
                    <tr><td>订单号</td><td>id</td><td>格式ORDXXX</td></tr>
                    <tr><td>商品名称</td><td>goodsName</td><td>商品SPU名称</td></tr>
                    <tr><td>数量</td><td>quantity</td><td>购买数量</td></tr>
                    <tr><td>订单金额</td><td>totalAmount</td><td>订单总金额</td></tr>
                    <tr><td>微信支付</td><td>wxPayAmount</td><td>微信支付金额</td></tr>
                    <tr><td>其他支付</td><td>otherPayAmount</td><td>卡金/赠金/积分等</td></tr>
                    <tr><td>需充值保证金</td><td>needDeposit</td><td>需商家充值的金额</td></tr>
                    <tr><td>订单状态</td><td>status</td><td>见状态说明</td></tr>
                    <tr><td>创建时间</td><td>createTime</td><td>下单时间</td></tr>
                </table>
                
                <h4>订单状态流转</h4>
                <table class="doc-table">
                    <tr><th>状态值</th><th>显示名称</th><th>说明</th><th>下一状态</th></tr>
                    <tr><td>pending_deposit</td><td>待充值保证金</td><td>需商家充值后才能发货</td><td>pending_ship</td></tr>
                    <tr><td>pending_ship</td><td>待发货</td><td>可以安排发货</td><td>shipped</td></tr>
                    <tr><td>shipped</td><td>已发货</td><td>等待确认收货</td><td>completed</td></tr>
                    <tr><td>completed</td><td>已完成</td><td>等待T+7结算</td><td>settled</td></tr>
                    <tr><td>settled</td><td>已结算</td><td>资金已结算</td><td>-</td></tr>
                </table>
                
                <h4>分账字段说明</h4>
                <table class="doc-table">
                    <tr><th>字段名</th><th>说明</th></tr>
                    <tr><td>fee</td><td>交易手续费（0.6%）</td></tr>
                    <tr><td>netAmount</td><td>扣除手续费后金额</td></tr>
                    <tr><td>merchantProfit</td><td>商家收益</td></tr>
                    <tr><td>brandProfit</td><td>品牌总部收益</td></tr>
                    <tr><td>merchantActualProfit</td><td>商家实际收益（扣除总部分成）</td></tr>
                    <tr><td>operationProfit</td><td>私域运营平台收益</td></tr>
                    <tr><td>platformProfit</td><td>供应链平台收益</td></tr>
                </table>
                
                <h4>业务规则</h4>
                <div class="tip">
                    <p>1. canShip=true时订单可发货</p>
                    <p>2. depositPaid=true表示保证金已支付</p>
                    <p>3. 确认收货后T+7天进行结算</p>
                </div>
            `
        },

        'supply-chain-finance': {
            title: '财务对账',
            content: `
                <h4>页面说明</h4>
                <p>查看财务对账信息、收益明细和结算记录。</p>
                
                <h4>对账内容</h4>
                <ul>
                    <li><strong>收益总览</strong>：本月收益、累计收益、待结算金额</li>
                    <li><strong>订单收益明细</strong>：每笔订单的分账详情</li>
                    <li><strong>保证金流水</strong>：充值、冻结、结算记录</li>
                    <li><strong>发票记录</strong>：已开票和待开票金额</li>
                </ul>
                
                <h4>发票相关字段</h4>
                <table class="doc-table">
                    <tr><th>字段名</th><th>说明</th></tr>
                    <tr><td>invoicedAmount</td><td>已开票金额</td></tr>
                    <tr><td>pendingInvoiceAmount</td><td>待开票金额</td></tr>
                </table>
            `
        }
    },

    // ==================== MG管理后台文档 ====================
    'mg': {
        'dashboard': {
            title: '数据概览',
            content: `
                <h4>页面说明</h4>
                <p>MG管理后台工作台，展示平台运营数据概览。</p>
                
                <h4>统计卡片</h4>
                <table class="doc-table">
                    <tr><th>指标</th><th>数据来源</th><th>计算逻辑</th></tr>
                    <tr><td>待审核申请</td><td>applications</td><td>status='pending'的数量</td></tr>
                    <tr><td>合作商户</td><td>applications</td><td>status='signed'的数量</td></tr>
                    <tr><td>今日订单</td><td>orders</td><td>今日创建的订单数</td></tr>
                    <tr><td>本月销售额</td><td>orders</td><td>本月订单totalAmount求和</td></tr>
                    <tr><td>累计保证金</td><td>deposits</td><td>所有商户totalDeposit求和</td></tr>
                    <tr><td>产品数量</td><td>products</td><td>产品总数</td></tr>
                </table>
                
                <h4>待处理事项</h4>
                <ul>
                    <li>待审核的入驻申请</li>
                    <li>待发货的订单</li>
                    <li>库存预警的产品</li>
                </ul>
            `
        },

        'merchants': {
            title: '商户入驻',
            content: `
                <h4>页面说明</h4>
                <p>管理商户入驻申请，进行审核操作，查看签署日志和操作日志。包含两个Tab：入驻审批和分成管理。</p>
                
                <h4>Tab页签</h4>
                <ul>
                    <li><strong>入驻审批</strong>：审核商户入驻申请</li>
                    <li><strong>分成管理</strong>：包含商户号分账接收方设置和营业部分成设置两个子Tab</li>
                </ul>
                
                <h4>入驻审批列表字段</h4>
                <table class="doc-table">
                    <tr><th>显示名称</th><th>字段名</th><th>说明</th></tr>
                    <tr><td>申请编号</td><td>id</td><td>格式APPyyyymmXXX</td></tr>
                    <tr><td>商户号</td><td>merchantId</td><td>伊智付商户号</td></tr>
                    <tr><td>商户名称</td><td>-</td><td>关联merchants.name</td></tr>
                    <tr><td>申请人</td><td>applicantName</td><td>申请人姓名</td></tr>
                    <tr><td>联系电话</td><td>applicantPhone</td><td>申请人手机号</td></tr>
                    <tr><td>分账接收方</td><td>brandMerchantId</td><td>分账接收方商户号，null表示单店（原：品牌总部）</td></tr>
                    <tr><td>状态</td><td>status</td><td>申请状态</td></tr>
                    <tr><td>申请时间</td><td>createTime</td><td>提交时间</td></tr>
                </table>
                
                <h4>筛选条件</h4>
                <table class="doc-table">
                    <tr><th>条件</th><th>字段</th><th>匹配方式</th></tr>
                    <tr><td>商户号</td><td>merchantId</td><td>模糊匹配</td></tr>
                    <tr><td>状态</td><td>status</td><td>精确匹配</td></tr>
                    <tr><td>申请时间</td><td>createTime</td><td>日期范围</td></tr>
                    <tr><td>审核时间</td><td>auditTime</td><td>日期范围</td></tr>
                    <tr><td>伊智付分账状态</td><td>hasSubAccount</td><td>已开通/未开通</td></tr>
                    <tr><td>营业执照经营范围</td><td>scope</td><td>符合/不符合</td></tr>
                    <tr><td>审核状态</td><td>status</td><td>待审核/已通过/已拒绝</td></tr>
                    <tr><td>签约状态</td><td>status</td><td>已签约/待签约</td></tr>
                </table>
                
                <h4>审核操作</h4>
                <div class="note">
                    <p><strong>审核通过流程（2026-01-22 最新简化）：</strong></p>
                    <p>1. 点击"审核"按钮打开审核弹窗</p>
                    <p>2. 查看申请信息：</p>
                    <p>   - 商户号</p>
                    <p>   - 商户名称</p>
                    <p>   - 营业执照主体</p>
                    <p>   - 申请人</p>
                    <p>   - 营业执照图片</p>
                    <p>3. 判断营业执照经营范围：</p>
                    <p>   - 选择"符合"或"不符合"</p>
                    <p>   - 如选择"不符合"，点击审核通过会报错</p>
                    <p>   - 错误提示："营业执照经营范围不符合所需经营范围，只能拒绝让商户进行工商变更"</p>
                    <p>4. 设置分佣比例区间：</p>
                    <p>   - 商家收益比例区间（如8-12%）</p>
                    <p>   - 供应链平台收益比例区间（如68-72%）</p>
                    <p>   - 私域运营平台收益比例区间（如18-22%）</p>
                    <p>5. 三方比例之和必须等于100%</p>
                    <p>6. 填写审核备注</p>
                    <p>7. 点击"审核通过"</p>
                    <p><strong>⚠️ 2026-01-22 更新：</strong></p>
                    <p>• 已去掉"品牌总部分成比例（占商家收益%）"字段</p>
                    <p>• 已去掉"品牌总部：YZF202501004 (分成15%)"信息显示</p>
                    <p>• 已去掉"AI检测结果"</p>
                    <p>• 新增"营业执照判断是否符合所需经营范围"单选框</p>
                </div>
                
                <h4>审核后数据变化</h4>
                <table class="doc-table">
                    <tr><th>操作</th><th>status变化</th><th>其他字段</th></tr>
                    <tr><td>审核通过</td><td>pending → pending_sign</td><td>设置auditTime、auditor、分佣比例、contracts</td></tr>
                    <tr><td>审核拒绝</td><td>pending → rejected</td><td>设置auditTime、auditor、auditRemark</td></tr>
                </table>
                
                <h4>分成管理 - 商户号分账接收方设置</h4>
                <div class="note">
                    <p><strong>功能说明：</strong></p>
                    <p>• 查看和管理各商户号配置的分账接收方及分走商户号的收益比例</p>
                    <p>• 支持新增和修改分账接收方设置</p>
                    <p>• 必须上传协议证明</p>
                    <p>• 记录所有操作日志（操作人、操作时间、操作来源等）</p>
                </div>
                
                <h4>商户号分账接收方列表字段</h4>
                <table class="doc-table">
                    <tr><th>显示名称</th><th>字段名</th><th>说明</th></tr>
                    <tr><td>商户号</td><td>merchantId</td><td>伊智付商户号</td></tr>
                    <tr><td>商户名称</td><td>merchantName</td><td>商户名称</td></tr>
                    <tr><td>绑定门店数</td><td>bindStoreCount</td><td>该商户绑定的门店数量</td></tr>
                    <tr><td>分账接收方</td><td>brandMerchantId</td><td>分账接收方的商户号（原：品牌总部商户号）</td></tr>
                    <tr><td>分账接收方名称</td><td>brandMerchantName</td><td>分账接收方名称（原：品牌总部名称）</td></tr>
                    <tr><td>分走商户号的收益比例</td><td>brandRatio</td><td>分账接收方从商户号收益中分走的比例（原：总部分成比例）</td></tr>
                </table>
                
                <h4>分成管理 - 营业部分成设置</h4>
                <div class="note">
                    <p><strong>功能说明：</strong></p>
                    <p>• 对外不展示营业部的分成设置</p>
                    <p>• 对内的MG管理后台的账单和财务对账表、结算表都要计算营业部的分成明细和汇总数据</p>
                    <p>• 设置营业部与伊智贸易公司的分成比例（占供应链平台收益）</p>
                </div>
                
                <h4>营业部分成列表字段</h4>
                <table class="doc-table">
                    <tr><th>显示名称</th><th>字段名</th><th>说明</th></tr>
                    <tr><td>营业部ID</td><td>id</td><td>营业部唯一标识（原：经销商ID）</td></tr>
                    <tr><td>营业部名称</td><td>name</td><td>营业部名称（原：经销商名称）</td></tr>
                    <tr><td>营业部占供应链平台收益比例</td><td>ratio</td><td>营业部从供应链平台收益中分走的比例（原：经销商分成比例）</td></tr>
                    <tr><td>伊智贸易分成比例</td><td>tradeCompanyRatio</td><td>伊智贸易公司的分成比例</td></tr>
                    <tr><td>营业部入驻客户数量</td><td>bindMerchantCount</td><td>该营业部发展的入驻商户数量（原：绑定商户数）</td></tr>
                </table>
            `
        },

        'products': {
            title: '产品维护',
            content: `
                <h4>页面说明</h4>
                <p>管理产品原始数据，处理出入库操作。产品是商品组合的基础单元。</p>
                
                <h4>产品列表字段</h4>
                <table class="doc-table">
                    <tr><th>显示名称</th><th>字段名</th><th>类型</th><th>说明</th></tr>
                    <tr><td>产品ID</td><td>id</td><td>String</td><td>格式PRODXXX</td></tr>
                    <tr><td>产品名称</td><td>name</td><td>String</td><td>产品名称</td></tr>
                    <tr><td>库存</td><td>stock</td><td>Number</td><td>当前库存数量</td></tr>
                    <tr><td>供应商</td><td>supplier</td><td>String</td><td>供应商名称</td></tr>
                    <tr><td>供应商编码</td><td>supplierCode</td><td>String</td><td>供应商编码</td></tr>
                    <tr><td>单价</td><td>price</td><td>Number</td><td>产品单价（元）</td></tr>
                    <tr><td>发货方式</td><td>deliveryMethod</td><td>String</td><td>一件代发</td></tr>
                    <tr><td>创建人</td><td>creator</td><td>String</td><td>创建人姓名</td></tr>
                    <tr><td>创建时间</td><td>createTime</td><td>DateTime</td><td>创建时间</td></tr>
                </table>
                
                <h4>出入库操作</h4>
                <table class="doc-table">
                    <tr><th>操作类型</th><th>type值</th><th>库存变化</th></tr>
                    <tr><td>入库</td><td>in</td><td>stock增加</td></tr>
                    <tr><td>出库</td><td>out</td><td>stock减少</td></tr>
                </table>
                
                <h4>出入库记录字段（stockLogs表）</h4>
                <table class="doc-table">
                    <tr><th>字段名</th><th>说明</th></tr>
                    <tr><td>productId</td><td>关联产品ID</td></tr>
                    <tr><td>type</td><td>in=入库, out=出库</td></tr>
                    <tr><td>quantity</td><td>数量</td></tr>
                    <tr><td>beforeStock</td><td>操作前库存</td></tr>
                    <tr><td>afterStock</td><td>操作后库存</td></tr>
                    <tr><td>operator</td><td>操作人</td></tr>
                    <tr><td>remark</td><td>备注</td></tr>
                    <tr><td>createTime</td><td>操作时间</td></tr>
                </table>
            `
        },

        'goods': {
            title: '商品组合',
            content: `
                <h4>页面说明</h4>
                <p>将同一供应商的产品组合成商品，设置销售价格和分佣比例。</p>
                
                <h4>商品列表字段</h4>
                <table class="doc-table">
                    <tr><th>显示名称</th><th>字段名</th><th>说明</th></tr>
                    <tr><td>商品ID</td><td>id</td><td>格式SPUXXX</td></tr>
                    <tr><td>商品名称</td><td>name</td><td>商品名称</td></tr>
                    <tr><td>分类</td><td>category</td><td>商品分类</td></tr>
                    <tr><td>成本价</td><td>costPrice</td><td>产品成本合计</td></tr>
                    <tr><td>销售价</td><td>salePrice</td><td>销售价格</td></tr>
                    <tr><td>原价</td><td>originalPrice</td><td>商城折前价</td></tr>
                    <tr><td>状态</td><td>status</td><td>online=上架, offline=下架</td></tr>
                    <tr><td>更新时间</td><td>updateTime</td><td>最后更新时间</td></tr>
                </table>
                
                <h4>商品组合规则</h4>
                <div class="note">
                    <p>1. 只能选择同一供应商的产品进行组合</p>
                    <p>2. 每个产品可设置数量</p>
                    <p>3. 成本价 = Σ(产品单价 × 数量)</p>
                </div>
                
                <h4>产品组合字段（goods.products数组）</h4>
                <table class="doc-table">
                    <tr><th>字段名</th><th>说明</th></tr>
                    <tr><td>productId</td><td>产品ID</td></tr>
                    <tr><td>productName</td><td>产品名称</td></tr>
                    <tr><td>quantity</td><td>数量</td></tr>
                    <tr><td>lockedPrice</td><td>锁定单价</td></tr>
                </table>
                
                <h4>三方分账比例设置</h4>
                <div class="tip">
                    <p><strong>2026-01-22更新：分账比例设置已独立为单独Tab</strong></p>
                    <p>• 编辑商品组合弹窗中已移除分账比例设置</p>
                    <p>• 在商品详情面板的"三方分账比例设置"Tab中进行设置</p>
                    <p>• 位置：点击商品行 → 右侧详情面板 → "三方分账比例设置"Tab</p>
                </div>
                
                <div class="note">
                    <p><strong>三方分账比例包括：</strong></p>
                    <p>• 收款商户号分账比例</p>
                    <p>• 私域运营平台分账比例</p>
                    <p>• 供应链平台分账比例</p>
                    <p><strong>约束条件：</strong>三方分账比例之和必须等于100%</p>
                    <p><strong>默认值：</strong>收款商户号10%、私域运营平台20%、供应链平台70%</p>
                </div>
                
                <div class="tip">
                    <p><strong>操作步骤：</strong></p>
                    <p>1. 在商品列表中点击任意商品行</p>
                    <p>2. 右侧打开商品详情面板</p>
                    <p>3. 点击"三方分账比例设置"Tab（在"商品价格列表"之后）</p>
                    <p>4. 查看当前分账比例</p>
                    <p>5. 在"修改分账比例"表单中输入新的比例</p>
                    <p>6. 系统会实时验证总和是否等于100%</p>
                    <p>7. 点击"保存分账比例"按钮</p>
                    <p>8. 保存成功后会记录操作日志</p>
                </div>
                
                <h4>分账计算方案</h4>
                <div class="note">
                    <p><strong>第一步：扣除交易手续费</strong></p>
                    <p>可分账金额 = 销售价格 - 交易手续费（0.6%）</p>
                    <p>例如：销售价格100元，手续费0.6元，可分账金额99.4元</p>
                </div>
                
                <div class="note">
                    <p><strong>第二步：按三方分账比例分配</strong></p>
                    <p>• 收款商户号初始收益 = 可分账金额 × 收款商户号分账比例</p>
                    <p>• 私域运营平台收益 = 可分账金额 × 私域运营平台分账比例</p>
                    <p>• 供应链平台初始收益 = 可分账金额 × 供应链平台分账比例</p>
                    <p>例如：可分账金额99.4元，比例为10%、20%、70%</p>
                    <p>则初始分配为：9.94元、19.88元、69.58元</p>
                </div>
                
                <div class="note">
                    <p><strong>第三步：收款商户号二次分账（如有设置）</strong></p>
                    <p>如果收款商户号设置了【分走商户号的收益比例】（如品牌总部分成）：</p>
                    <p>• 分账接收方收益 = 收款商户号初始收益 × 分走商户号的收益比例</p>
                    <p>• 收款商户号最终收益 = 收款商户号初始收益 - 分账接收方收益</p>
                    <p>例如：收款商户号初始收益9.94元，分走比例10%</p>
                    <p>则分账接收方收益0.994元，收款商户号最终收益8.946元</p>
                </div>
                
                <div class="note">
                    <p><strong>第四步：供应链平台二次分账</strong></p>
                    <p>供应链平台收益需要按营业部和伊智贸易的比例再次分配：</p>
                    <p>• 营业部收益 = 供应链平台初始收益 × 营业部占供应链平台收益比例</p>
                    <p>• 伊智贸易收益 = 供应链平台初始收益 × 伊智贸易分成比例</p>
                    <p>例如：供应链平台初始收益69.58元，营业部比例30%，伊智贸易比例70%</p>
                    <p>则营业部收益20.874元，伊智贸易收益48.706元</p>
                </div>
                
                <div class="tip">
                    <p><strong>完整计算示例：</strong></p>
                    <p>销售价格：100元</p>
                    <p>交易手续费：0.6元（0.6%）</p>
                    <p>可分账金额：99.4元</p>
                    <p><strong>三方初始分账（10%、20%、70%）：</strong></p>
                    <p>• 收款商户号初始：9.94元</p>
                    <p>• 私域运营平台：19.88元</p>
                    <p>• 供应链平台初始：69.58元</p>
                    <p><strong>收款商户号二次分账（分走比例10%）：</strong></p>
                    <p>• 分账接收方：0.994元</p>
                    <p>• 收款商户号最终：8.946元</p>
                    <p><strong>供应链平台二次分账（营业部30%、伊智贸易70%）：</strong></p>
                    <p>• 营业部：20.874元</p>
                    <p>• 伊智贸易：48.706元</p>
                    <p><strong>最终各方收益汇总：</strong></p>
                    <p>收款商户号：8.946元 | 分账接收方：0.994元 | 私域运营平台：19.88元 | 营业部：20.874元 | 伊智贸易：48.706元</p>
                    <p>总计：99.4元 ✓</p>
                </div>
                
                <h4>价格设置（goodsPrices表）</h4>
                <table class="doc-table">
                    <tr><th>字段名</th><th>说明</th></tr>
                    <tr><td>goodsId</td><td>关联商品ID</td></tr>
                    <tr><td>salePrice</td><td>销售价</td></tr>
                    <tr><td>originalPrice</td><td>原价</td></tr>
                    <tr><td>startTime</td><td>生效开始时间</td></tr>
                    <tr><td>endTime</td><td>生效结束时间</td></tr>
                    <tr><td>merchantRatio</td><td>收款商户号分账比例%</td></tr>
                    <tr><td>operationRatio</td><td>私域运营平台分账比例%</td></tr>
                    <tr><td>platformRatio</td><td>供应链平台分账比例%</td></tr>
                </table>
            `
        },

        'mall-goods': {
            title: '商城商品',
            content: `
                <h4>页面说明</h4>
                <p>多规格商品管理，直接在小程序展示销售。</p>
                
                <h4>商城商品字段</h4>
                <table class="doc-table">
                    <tr><th>字段名</th><th>说明</th></tr>
                    <tr><td>id</td><td>商城商品ID</td></tr>
                    <tr><td>name</td><td>商品名称</td></tr>
                    <tr><td>specs</td><td>规格列表（关联多个SPU）</td></tr>
                    <tr><td>status</td><td>上下架状态</td></tr>
                </table>
                
                <h4>规格设置</h4>
                <div class="note">
                    <p>1. 多个商品组合(SPU)组成不同规格</p>
                    <p>2. 单个商品作为单规格</p>
                    <p>3. 规格名称、图片可自定义</p>
                </div>
            `
        },

        'shipping': {
            title: '邮费管理',
            content: `
                <h4>页面说明</h4>
                <p>管理邮费模板，设置不同地区的运费规则。</p>
                
                <h4>邮费模板字段（shippingTemplates表）</h4>
                <table class="doc-table">
                    <tr><th>字段名</th><th>说明</th></tr>
                    <tr><td>id</td><td>模板ID</td></tr>
                    <tr><td>name</td><td>模板名称</td></tr>
                    <tr><td>type</td><td>free=包邮, standard=标准运费</td></tr>
                    <tr><td>defaultFee</td><td>默认运费</td></tr>
                    <tr><td>areas</td><td>地区运费配置数组</td></tr>
                </table>
            `
        },

        'categories': {
            title: '分类管理',
            content: `
                <h4>页面说明</h4>
                <p>管理商城商品分类。</p>
                
                <h4>分类字段（categories表）</h4>
                <table class="doc-table">
                    <tr><th>字段名</th><th>说明</th></tr>
                    <tr><td>id</td><td>分类ID</td></tr>
                    <tr><td>name</td><td>分类名称</td></tr>
                    <tr><td>sort</td><td>排序序号</td></tr>
                </table>
            `
        },

        'exclude-areas': {
            title: '不可下单地区',
            content: `
                <h4>页面说明</h4>
                <p>维护不可发货地区模板。</p>
                
                <h4>模板字段（excludeAreaTemplates表）</h4>
                <table class="doc-table">
                    <tr><th>字段名</th><th>说明</th></tr>
                    <tr><td>id</td><td>模板ID</td></tr>
                    <tr><td>name</td><td>模板名称（如：偏远地区）</td></tr>
                    <tr><td>areas</td><td>地区数组（如：西藏、新疆）</td></tr>
                </table>
            `
        },

        'after-sale': {
            title: '售后规则',
            content: `
                <h4>页面说明</h4>
                <p>管理商品售后规则。</p>
                
                <h4>售后规则字段（afterSaleRules表）</h4>
                <table class="doc-table">
                    <tr><th>字段名</th><th>说明</th></tr>
                    <tr><td>id</td><td>规则ID</td></tr>
                    <tr><td>name</td><td>规则名称</td></tr>
                    <tr><td>returnDays</td><td>可退货天数</td></tr>
                    <tr><td>exchangeDays</td><td>可换货天数</td></tr>
                    <tr><td>description</td><td>规则说明</td></tr>
                </table>
            `
        },

        'deposits': {
            title: '预收款管理',
            content: `
                <h4>页面说明</h4>
                <p>管理所有商户的保证金（预收款），查看充值记录，处理发票。</p>
                
                <h4>商户保证金列表字段</h4>
                <table class="doc-table">
                    <tr><th>显示名称</th><th>字段名</th><th>说明</th></tr>
                    <tr><td>商户号</td><td>merchantId</td><td>伊智付商户号</td></tr>
                    <tr><td>累计充值</td><td>totalDeposit</td><td>历史累计充值总额</td></tr>
                    <tr><td>充值次数</td><td>rechargeCount</td><td>充值次数</td></tr>
                    <tr><td>可用保证金</td><td>availableDeposit</td><td>当前可用金额</td></tr>
                    <tr><td>需提现保证金</td><td>needWithdrawDeposit</td><td>营业执照变更需提现</td></tr>
                    <tr><td>冻结中</td><td>frozenDeposit</td><td>订单占用金额</td></tr>
                    <tr><td>已结算</td><td>settledDeposit</td><td>已完成结算金额</td></tr>
                    <tr><td>已开票</td><td>invoicedAmount</td><td>已开票金额</td></tr>
                    <tr><td>待开票</td><td>pendingInvoiceAmount</td><td>待开票金额</td></tr>
                </table>
                
                <h4>保证金流水记录（depositLogs表）</h4>
                <table class="doc-table">
                    <tr><th>字段名</th><th>说明</th></tr>
                    <tr><td>merchantId</td><td>商户号</td></tr>
                    <tr><td>type</td><td>recharge/freeze/settle/withdraw</td></tr>
                    <tr><td>amount</td><td>金额（正数增加，负数减少）</td></tr>
                    <tr><td>balance</td><td>操作后余额</td></tr>
                    <tr><td>orderId</td><td>关联订单号（如有）</td></tr>
                    <tr><td>remark</td><td>备注</td></tr>
                    <tr><td>payMethod</td><td>支付方式（充值时）</td></tr>
                    <tr><td>createTime</td><td>操作时间</td></tr>
                </table>
                
                <h4>发票管理（invoices表）</h4>
                <table class="doc-table">
                    <tr><th>字段名</th><th>说明</th></tr>
                    <tr><td>merchantId</td><td>商户号</td></tr>
                    <tr><td>amount</td><td>开票金额</td></tr>
                    <tr><td>invoiceNo</td><td>发票号码</td></tr>
                    <tr><td>invoiceType</td><td>发票类型</td></tr>
                    <tr><td>invoiceUrl</td><td>电子发票URL</td></tr>
                    <tr><td>status</td><td>issued=已开票</td></tr>
                    <tr><td>issueTime</td><td>开票时间</td></tr>
                </table>
            `
        },

        'orders': {
            title: '订单管理',
            content: `
                <h4>页面说明</h4>
                <p>管理平台所有商户订单，处理发货和售后。</p>
                
                <h4>订单列表字段</h4>
                <table class="doc-table">
                    <tr><th>显示名称</th><th>字段名</th><th>说明</th></tr>
                    <tr><td>订单号</td><td>id</td><td>格式ORDXXX</td></tr>
                    <tr><td>商户号</td><td>merchantId</td><td>下单商户</td></tr>
                    <tr><td>门店</td><td>storeName</td><td>门店名称</td></tr>
                    <tr><td>商品</td><td>goodsName</td><td>商品名称</td></tr>
                    <tr><td>数量</td><td>quantity</td><td>购买数量</td></tr>
                    <tr><td>订单金额</td><td>totalAmount</td><td>订单总金额</td></tr>
                    <tr><td>微信支付</td><td>wxPayAmount</td><td>微信支付金额</td></tr>
                    <tr><td>需充值保证金</td><td>needDeposit</td><td>需商家充值金额</td></tr>
                    <tr><td>保证金状态</td><td>depositPaid</td><td>true=已支付</td></tr>
                    <tr><td>可发货</td><td>canShip</td><td>true=可发货</td></tr>
                    <tr><td>订单状态</td><td>status</td><td>订单状态</td></tr>
                    <tr><td>客户</td><td>customerName</td><td>收货人</td></tr>
                    <tr><td>地址</td><td>address</td><td>收货地址</td></tr>
                    <tr><td>创建时间</td><td>createTime</td><td>下单时间</td></tr>
                </table>
                
                <h4>分账明细字段</h4>
                <table class="doc-table">
                    <tr><th>字段名</th><th>说明</th></tr>
                    <tr><td>wxSplitToBrand</td><td>微信分账给分账接收方（如品牌总部）</td></tr>
                    <tr><td>wxSplitToOperation</td><td>微信分账给私域运营平台</td></tr>
                    <tr><td>wxSplitToPlatform</td><td>微信分账给供应链平台</td></tr>
                    <tr><td>wxSplitToMerchant</td><td>微信分账给收款商户号</td></tr>
                </table>
            `
        },

        'finance': {
            title: '财务对账',
            content: `
                <h4>页面说明</h4>
                <p>查看平台收益、对账单、分账记录。</p>
                
                <h4>财务统计</h4>
                <table class="doc-table">
                    <tr><th>指标</th><th>计算逻辑</th></tr>
                    <tr><td>平台总收益</td><td>所有订单platformProfit求和</td></tr>
                    <tr><td>营业部收益</td><td>platformProfit × distributorRatio（原：经销商收益）</td></tr>
                    <tr><td>伊智贸易收益</td><td>platformProfit × tradeCompanyRatio</td></tr>
                    <tr><td>待结算金额</td><td>status='completed'的订单收益</td></tr>
                    <tr><td>已结算金额</td><td>status='settled'的订单收益</td></tr>
                </table>
                
                <h4>分账记录</h4>
                <p>每笔订单的分账详情，包括各方收益金额和分账时间。</p>
                
                <h4>分账明细字段说明</h4>
                <table class="doc-table">
                    <tr><th>字段名</th><th>说明</th></tr>
                    <tr><td>merchantProfit</td><td>收款商户号收益</td></tr>
                    <tr><td>brandProfit</td><td>分账接收方收益（如品牌总部）</td></tr>
                    <tr><td>operationProfit</td><td>私域运营平台收益</td></tr>
                    <tr><td>platformProfit</td><td>供应链平台收益</td></tr>
                    <tr><td>distributorProfit</td><td>营业部收益（占供应链平台收益）</td></tr>
                    <tr><td>tradeCompanyProfit</td><td>伊智贸易收益（占供应链平台收益）</td></tr>
                </table>
            `
        },

        'mall-decoration': {
            title: '商城装修',
            content: `
                <h4>页面说明</h4>
                <p>管理小程序商城的页面装修，包括内容管理、模板管理和组件库。</p>
                
                <div style="background: #fff7e6; border: 2px solid #faad14; border-radius: 8px; padding: 15px; margin: 15px 0;">
                    <h4 style="color: #fa8c16; margin: 0 0 10px 0;">⚠️ 主页设置重要说明</h4>
                    <div style="font-size: 13px; line-height: 1.8;">
                        <p style="margin: 5px 0;"><strong>1. 主页唯一性：</strong>系统同时只能存在一个主页，这是强制性规则。</p>
                        <p style="margin: 5px 0;"><strong>2. 自动切换机制：</strong>当设置新页面为主页时，原主页会自动取消主页状态。</p>
                        <p style="margin: 5px 0;"><strong>3. 商家端自动适配：</strong>无论MG后台如何更改主页，商家端选择了"主页"的菜单栏会自动指向当前的主页，无需商家重新配置。</p>
                        <p style="margin: 5px 0;"><strong>4. 后台自动处理：</strong>系统会在后台自动处理主页的映射关系，确保商家端始终显示正确的主页内容。</p>
                        <p style="margin: 5px 0; color: #ff4d4f;"><strong>5. 操作需谨慎：</strong>更改主页会影响所有商家端的显示，请务必确认后再操作。</p>
                    </div>
                </div>
                
                <h4>功能模块</h4>
                <div class="note">
                    <p><strong>1. 内容管理</strong></p>
                    <p>• 管理商城的所有页面，包括首页、商品列表页、活动页等</p>
                    <p>• 支持创建、编辑、复制、预览和删除页面</p>
                    <p>• 可设置主页，主页不能删除</p>
                    <p>• 设置主页需要二次确认，避免误操作</p>
                    <p>• 提供可视化页面编辑器，支持拖拽组件配置页面</p>
                </div>
                
                <h4>页面编辑器</h4>
                <div class="tip">
                    <p><strong>编辑器功能：</strong></p>
                    <p>• <strong>左侧组件库：</strong>提供4种基础组件（商品、商品分组、商品搜索、图片广告）</p>
                    <p>• <strong>中间预览区：</strong>手机框架预览，实时显示页面效果</p>
                    <p>• <strong>右侧配置面板：</strong>配置页面信息和组件属性</p>
                    <p>• <strong>顶部工具栏：</strong>返回、保存草稿、保存并发布</p>
                </div>
                
                <h4>可用组件说明</h4>
                <table class="doc-table">
                    <tr><th>组件名称</th><th>功能说明</th><th>配置项</th></tr>
                    <tr>
                        <td>商品</td>
                        <td>展示商城商品列表，关联"商品管理-商城商品"Tab的商品</td>
                        <td>
                            • 显示样式：网格布局/列表布局<br>
                            • 选择商品：从商城商品中多选
                        </td>
                    </tr>
                    <tr>
                        <td>商品分组</td>
                        <td>按分类展示商品，自动显示该分类下的商品</td>
                        <td>
                            • 选择分类：从商品分类中选择<br>
                            • 显示数量：设置显示商品数量（1-50）
                        </td>
                    </tr>
                    <tr>
                        <td>商品搜索</td>
                        <td>提供商品搜索功能</td>
                        <td>
                            • 搜索框提示文字：自定义placeholder<br>
                            • 显示热门搜索词：开关控制
                        </td>
                    </tr>
                    <tr>
                        <td>图片广告</td>
                        <td>展示广告图片，支持跳转链接</td>
                        <td>
                            • 广告图片：设置图片URL<br>
                            • 链接类型：无链接/跳转商品/跳转页面/外部链接<br>
                            • 链接地址：根据链接类型设置
                        </td>
                    </tr>
                </table>
                
                <h4>编辑器操作流程</h4>
                <div class="note">
                    <p><strong>创建/编辑页面：</strong></p>
                    <p>1. 点击"创建页面"或"编辑"按钮进入页面编辑器</p>
                    <p>2. 从左侧组件库拖拽组件到中间预览区</p>
                    <p>3. 点击预览区的组件，在右侧配置面板进行配置</p>
                    <p>4. 配置页面名称和别名（在右侧配置面板）</p>
                    <p>5. 点击"保存草稿"保存但不发布，或"保存并发布"直接发布</p>
                    <p>6. 点击"返回"关闭编辑器（未保存的更改会丢失）</p>
                </div>
                
                <h4>组件配置详解</h4>
                <div class="tip">
                    <p><strong>商品组件配置：</strong></p>
                    <p>• 选择商品：从"商品管理-商城商品"Tab中的商品列表选择</p>
                    <p>• 支持多选，选中的商品会在预览区实时显示</p>
                    <p>• 网格布局：2列显示，适合展示多个商品</p>
                    <p>• 列表布局：单列显示，适合详细展示商品信息</p>
                </div>
                
                <div class="tip">
                    <p><strong>商品分组配置：</strong></p>
                    <p>• 选择分类：从商品分类中选择一个分类</p>
                    <p>• 显示数量：设置该分类下显示的商品数量</p>
                    <p>• 商品会自动从该分类下筛选，无需手动选择</p>
                </div>
                
                <div class="tip">
                    <p><strong>商品搜索配置：</strong></p>
                    <p>• 搜索框提示文字：自定义搜索框的placeholder文字</p>
                    <p>• 显示热门搜索词：开启后会在搜索框下方显示热门搜索词</p>
                </div>
                
                <div class="tip">
                    <p><strong>图片广告配置：</strong></p>
                    <p>• 广告图片：输入图片URL（实际使用时需要上传图片）</p>
                    <p>• 链接类型：</p>
                    <p>  - 无链接：仅展示图片，不可点击</p>
                    <p>  - 跳转商品：点击跳转到指定商品详情页</p>
                    <p>  - 跳转页面：点击跳转到商城内其他页面</p>
                    <p>  - 外部链接：点击跳转到外部URL</p>
                    <p>• 链接地址：根据链接类型填写对应的地址</p>
                </div>>
                
                <h4>页面列表字段</h4>
                <table class="doc-table">
                    <tr><th>字段名</th><th>说明</th></tr>
                    <tr><td>页面名称</td><td>页面的显示名称</td></tr>
                    <tr><td>别名</td><td>页面的URL路径标识，只能包含小写字母、数字和连字符</td></tr>
                    <tr><td>创建时间</td><td>页面创建时间</td></tr>
                    <tr><td>主页</td><td>是否为商城主页（系统只能有一个主页）</td></tr>
                    <tr><td>最后更新时间</td><td>页面最后修改时间</td></tr>
                    <tr><td>最后修改人</td><td>最后修改页面的操作人</td></tr>
                    <tr><td>状态</td><td>draft草稿 | published已发布</td></tr>
                </table>
                
                <h4>页面操作</h4>
                <table class="doc-table">
                    <tr><th>操作</th><th>说明</th></tr>
                    <tr><td>创建页面</td><td>创建新的商城页面，需填写页面名称和别名，可选择是否设为主页</td></tr>
                    <tr><td>设为主页</td><td>将当前页面设为主页，需要二次确认，原主页会自动取消</td></tr>
                    <tr><td>编辑</td><td>编辑页面内容和组件（开发中）</td></tr>
                    <tr><td>复制</td><td>复制现有页面，自动生成新的别名</td></tr>
                    <tr><td>预览</td><td>预览页面效果（开发中）</td></tr>
                    <tr><td>删除</td><td>删除页面，<span style="color: #ff4d4f; font-weight: 600;">主页不能删除</span></td></tr>
                </table>
                
                <div style="background: #fff2f0; border: 2px solid #ff4d4f; border-radius: 8px; padding: 15px; margin: 15px 0;">
                    <h4 style="color: #ff4d4f; margin: 0 0 10px 0;">🚫 主页删除限制</h4>
                    <div style="font-size: 13px; line-height: 1.8;">
                        <p style="margin: 5px 0; color: #ff4d4f; font-weight: 600;">主页的页面是无删除能力的，即主页是不可以删除的。</p>
                        <p style="margin: 5px 0;">如需删除当前主页，请先将其他页面设为主页，然后再删除原主页。</p>
                        <p style="margin: 5px 0;">主页在列表中不会显示"删除"按钮。</p>
                    </div>
                </div>
                
                <h4>数据结构</h4>
                <div class="tip">
                    <p><strong>mallPages表：</strong></p>
                    <p>• id: 页面ID，格式PAGE + 时间戳</p>
                    <p>• name: 页面名称</p>
                    <p>• alias: 页面别名（URL路径）</p>
                    <p>• isHomePage: 是否为主页（系统只能有一个为true）</p>
                    <p>• createTime: 创建时间</p>
                    <p>• updateTime: 更新时间</p>
                    <p>• lastEditor: 最后修改人</p>
                    <p>• status: 状态（draft/published）</p>
                    <p>• components: 页面组件配置数组</p>
                </div>
                
                <h4>使用说明</h4>
                <div class="note">
                    <p><strong>创建页面：</strong></p>
                    <p>1. 点击"创建页面"按钮</p>
                    <p>2. 填写页面名称（如：春节活动页）</p>
                    <p>3. 填写页面别名（如：spring-festival）</p>
                    <p>4. 可选择是否设为主页（需要二次确认）</p>
                    <p>5. 点击"创建"完成</p>
                </div>
                
                <div class="note">
                    <p><strong>设为主页：</strong></p>
                    <p>1. 在页面列表中找到要设为主页的页面</p>
                    <p>2. 点击"设为主页"按钮</p>
                    <p>3. 在确认对话框中确认操作</p>
                    <p>4. 系统自动将原主页取消，并设置新主页</p>
                    <p>5. 商家端会自动适配新的主页，无需重新配置</p>
                </div>
                
                <div class="tip">
                    <p><strong>⚠️ 重要注意事项：</strong></p>
                    <p>• <strong>主页唯一性：</strong>系统同时只能存在一个主页</p>
                    <p>• <strong>自动适配：</strong>商家端选择的"主页"菜单会自动指向当前主页，无需重新配置</p>
                    <p>• <strong>二次确认：</strong>设为主页操作需要二次确认，避免误操作</p>
                    <p>• <strong style="color: #ff4d4f;">主页保护：</strong><span style="color: #ff4d4f;">主页不能删除，如需删除请先设置其他页面为主页</span></p>
                    <p>• <strong>别名唯一：</strong>页面别名必须唯一</p>
                    <p>• <strong>别名格式：</strong>页面别名只能包含小写字母、数字和连字符</p>
                    <p>• <strong>自动切换：</strong>设为主页后，原主页会自动取消主页状态</p>
                    <p>• <strong>复制规则：</strong>复制页面会自动生成新的别名</p>
                </div>
            `
        },

        'profit': {
            title: '分成管理',
            content: `
                <h4>页面说明</h4>
                <p>管理分润规则和分账接收方，包含两个子Tab：商户号分账接收方设置和营业部分成设置。</p>
                
                <h4>一、商户号分账接收方设置</h4>
                <div class="note">
                    <p><strong>功能说明：</strong></p>
                    <p>• 查看各商户号配置的分账接收方及分走商户号的收益比例</p>
                    <p>• 支持新增和修改分账接收方设置</p>
                    <p>• 记录所有操作日志，包括操作人、操作时间、操作来源等</p>
                </div>
                
                <h4>列表字段</h4>
                <table class="doc-table">
                    <tr><th>字段名</th><th>说明</th></tr>
                    <tr><td>商户号</td><td>伊智付商户号</td></tr>
                    <tr><td>商户名称</td><td>商户名称</td></tr>
                    <tr><td>绑定门店数</td><td>该商户绑定的门店数量</td></tr>
                    <tr><td>分账接收方</td><td>分账接收方的商户号（原：品牌总部商户号）</td></tr>
                    <tr><td>分账接收方名称</td><td>分账接收方名称（原：品牌总部名称）</td></tr>
                    <tr><td>分走商户号的收益比例</td><td>分账接收方从商户号收益中分走的比例（原：总部分成比例）</td></tr>
                </table>
                
                <h4>设置分账接收方功能</h4>
                <div class="tip">
                    <p><strong>操作步骤：</strong></p>
                    <p>1. 点击"+ 设置分账接收方"按钮</p>
                    <p>2. 选择商户号</p>
                    <p>3. 选择该商户号的分账接收方（从品牌总部的分账接收方列表中选择）</p>
                    <p>4. 设置"分走商户号的收益比例"（0-100%）</p>
                    <p>5. 上传协议证明（必填，支持PDF、JPG、PNG格式）</p>
                    <p>6. 提交后自动记录操作日志</p>
                </div>
                
                <h4>操作日志记录（profitReceiverLogs表）</h4>
                <table class="doc-table">
                    <tr><th>字段名</th><th>说明</th></tr>
                    <tr><td>merchantId</td><td>商户号</td></tr>
                    <tr><td>profitReceiverId</td><td>分账接收方ID</td></tr>
                    <tr><td>ratio</td><td>收益比例</td></tr>
                    <tr><td>proofUrl</td><td>协议证明文件URL</td></tr>
                    <tr><td>proofFileName</td><td>协议证明文件名</td></tr>
                    <tr><td>operator</td><td>操作人姓名</td></tr>
                    <tr><td>operatorAccount</td><td>操作人账号</td></tr>
                    <tr><td>operateTime</td><td>操作时间</td></tr>
                    <tr><td>operateType</td><td>操作类型：create=新增, update=修改, delete=删除</td></tr>
                    <tr><td>source</td><td>操作来源：mg_backend=MG管理后台, lite_merchant=Lite商户端</td></tr>
                    <tr><td>remark</td><td>备注说明</td></tr>
                </table>
                
                <div class="note">
                    <p><strong>日志来源说明：</strong></p>
                    <p>• 商家在Lite端申请入驻时填写的分账接收方，source为"lite_merchant"，operator为申请人账号</p>
                    <p>• MG管理后台设置或修改的分账接收方，source为"mg_backend"，operator为管理员账号</p>
                </div>
                
                <h4>二、营业部分成设置</h4>
                <div class="note">
                    <p><strong>功能说明：</strong></p>
                    <p>• 对外不展示营业部的分成设置</p>
                    <p>• 对内的MG管理后台的账单和财务对账表、结算表都要计算营业部的分成明细和汇总数据</p>
                    <p>• 设置营业部与伊智贸易公司的分成比例（占供应链平台收益）</p>
                </div>
                
                <h4>列表字段</h4>
                <table class="doc-table">
                    <tr><th>字段名</th><th>说明</th></tr>
                    <tr><td>营业部ID</td><td>营业部唯一标识（原：经销商ID）</td></tr>
                    <tr><td>营业部名称</td><td>营业部名称（原：经销商名称）</td></tr>
                    <tr><td>营业部占供应链平台收益比例</td><td>营业部从供应链平台收益中分走的比例（原：经销商分成比例）</td></tr>
                    <tr><td>伊智贸易分成比例</td><td>伊智贸易公司的分成比例</td></tr>
                    <tr><td>营业部入驻客户数量</td><td>该营业部发展的入驻商户数量（原：绑定商户数）</td></tr>
                </table>
                
                <h4>分润规则（profitRules表）</h4>
                <table class="doc-table">
                    <tr><th>字段名</th><th>说明</th></tr>
                    <tr><td>merchantId</td><td>商户号</td></tr>
                    <tr><td>merchantRatio</td><td>商家分成比例%</td></tr>
                    <tr><td>brandRatio</td><td>分走商户号的收益比例%（占商家收益）</td></tr>
                    <tr><td>profitReceiverId</td><td>分账接收方ID</td></tr>
                    <tr><td>operationRatio</td><td>私域运营平台分成比例%</td></tr>
                    <tr><td>platformRatio</td><td>供应链平台分成比例%</td></tr>
                    <tr><td>distributorRatio</td><td>营业部分成比例%（占平台收益）</td></tr>
                    <tr><td>tradeCompanyRatio</td><td>伊智贸易分成比例%（占平台收益）</td></tr>
                </table>
                
                <h4>分账接收方（profitReceivers表）</h4>
                <table class="doc-table">
                    <tr><th>字段名</th><th>说明</th></tr>
                    <tr><td>merchantId</td><td>所属商户号</td></tr>
                    <tr><td>receiverName</td><td>接收方名称</td></tr>
                    <tr><td>receiverAccount</td><td>接收方账号</td></tr>
                    <tr><td>receiverType</td><td>账户类型</td></tr>
                    <tr><td>ratio</td><td>分成比例</td></tr>
                    <tr><td>status</td><td>active=启用</td></tr>
                </table>
                
                <h4>分账计算公式</h4>
                <div class="note">
                    <p><strong>基础分账：</strong></p>
                    <p>可分账金额 = 实际售价 - 交易手续费(0.6%)</p>
                    <p>商家收益 = 可分账金额 × merchantRatio%</p>
                    <p>供应链平台收益 = 可分账金额 × platformRatio%</p>
                    <p>私域运营平台收益 = 可分账金额 × operationRatio%</p>
                    <p><strong>品牌总部分成：</strong></p>
                    <p>品牌总部收益 = 商家收益 × brandRatio%</p>
                    <p>分店实际收益 = 商家收益 - 品牌总部收益</p>
                    <p><strong>供应链平台内部分成：</strong></p>
                    <p>经销商收益 = 供应链平台收益 × distributorRatio%</p>
                    <p>伊智贸易收益 = 供应链平台收益 × tradeCompanyRatio%</p>
                </div>
                
                <h4>分账约束</h4>
                <ul>
                    <li>merchantRatio + platformRatio + operationRatio = 100%</li>
                    <li>分账时至少保留商家10%，最多分账90%</li>
                    <li>分账优先级：品牌总部 > 私域运营平台 > 供应链平台</li>
                </ul>
            `
        }
    }
};


// 获取页面文档
function getPageDoc(system, page) {
    const systemDocs = PageDocs[system];
    if (!systemDocs) return null;
    return systemDocs[page] || null;
}

// 更新文档面板内容
function updateDocPanel(page) {
    const docContent = document.getElementById('doc-content');
    const docPageName = document.getElementById('doc-page-name');
    
    if (!docContent || !docPageName) return;
    
    // 判断当前系统
    const system = window.location.pathname.includes('/lite/') ? 'lite' : 'mg';
    const doc = getPageDoc(system, page);
    
    if (doc) {
        docPageName.textContent = doc.title;
        docContent.innerHTML = `<div class="doc-content">${doc.content}</div>`;
    } else {
        docPageName.textContent = page || '未知页面';
        docContent.innerHTML = `
            <div class="doc-placeholder">
                <div class="icon">📝</div>
                <p>该页面暂无产品文档</p>
                <p style="font-size: 12px; margin-top: 10px;">页面标识：${page}</p>
            </div>
        `;
    }
}

// 切换文档面板显示/隐藏
function toggleDocPanel() {
    const panel = document.getElementById('doc-panel');
    const container = document.querySelector('.app-container');
    
    if (panel && container) {
        panel.classList.toggle('collapsed');
        container.classList.toggle('doc-collapsed');
        
        // 保存状态到 localStorage
        const isCollapsed = panel.classList.contains('collapsed');
        localStorage.setItem('doc_panel_collapsed', isCollapsed ? 'true' : 'false');
    }
}

// 初始化文档面板状态
function initDocPanel() {
    const panel = document.getElementById('doc-panel');
    const container = document.querySelector('.app-container');
    
    if (panel && container) {
        const isCollapsed = localStorage.getItem('doc_panel_collapsed') === 'true';
        if (isCollapsed) {
            panel.classList.add('collapsed');
            container.classList.add('doc-collapsed');
        }
    }
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', initDocPanel);
