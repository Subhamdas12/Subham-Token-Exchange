//SPDX-Licese-Identifier:MIT
pragma solidity ^0.8.17;
import "./Token.sol";

contract Exchange {
    //State variables
    address private immutable i_feeAccount;
    uint256 private immutable i_feePercent;
    uint256 private s_orderId;
    //Mapping
    mapping(address => mapping(address => uint256)) public s_tokens;
    mapping(uint256 => _Order) public s_order;
    mapping(uint256 => bool) public s_cancelledOrder;
    mapping(uint256 => bool) public s_filledOrder;

    //Events
    event Exchange__DepositToken(
        address token,
        address owner,
        uint256 amount,
        uint256 balance
    );

    event Exchange__WithdrawToken(
        address token,
        address owner,
        uint256 amount,
        uint256 balance
    );

    event Exchange__MakeOrder(
        uint256 orderId,
        address owner,
        address tokenGet,
        uint256 amountGet,
        address tokenGive,
        uint256 amountGive,
        uint256 timeStamp
    );

    event Exchange__CancelOrder(
        uint256 orderId,
        address owner,
        address tokenGet,
        uint256 amountGet,
        address tokenGive,
        uint256 amountGive,
        uint256 timeStamp
    );
    event Exchange__Trade(
        uint256 orderId,
        address filler,
        address tokenGet,
        uint256 amountGet,
        address tokenGive,
        uint256 amountGive,
        address owner,
        uint256 timeStamp
    );

    event Exchange__TokenPurchased(
        address owner,
        address token,
        uint256 amount
    );
    event Exchange__TokenSold(address owner, address token, uint256 amount);

    //Struct
    struct _Order {
        uint256 orderId;
        address owner;
        address tokenGet;
        uint256 amountGet;
        address tokenGive;
        uint256 amountGive;
        uint256 timeStamp;
    }

    //Constructor
    constructor(address _feeAccount, uint256 _feePercent) {
        i_feeAccount = _feeAccount;
        i_feePercent = _feePercent;
    }

    // Internal function
    function _trade(
        uint256 _orderId,
        address _owner,
        address _tokenGet,
        uint256 _amountGet,
        address _tokenGive,
        uint256 _amountGive
    ) internal {
        uint256 _feeAmount = (_amountGet * i_feePercent) / 100;
        s_tokens[_tokenGet][msg.sender] -= (_amountGet + _feeAmount);
        s_tokens[_tokenGet][_owner] += _amountGet;
        s_tokens[_tokenGet][i_feeAccount] += _feeAmount;
        s_tokens[_tokenGive][msg.sender] += _amountGive;
        s_tokens[_tokenGive][_owner] -= _amountGive;
        emit Exchange__Trade(
            _orderId,
            msg.sender,
            _tokenGet,
            _amountGet,
            _tokenGive,
            _amountGive,
            _owner,
            block.timestamp
        );
    }

    //Public functions
    function fund(address _token) public payable {
        s_tokens[_token][msg.sender] += msg.value;
    }

    function depositToken(
        address _token,
        uint256 _amount
    ) public returns (bool success) {
        require(
            Token(_token).transferFrom(msg.sender, address(this), _amount),
            "Deposit failed"
        );
        s_tokens[_token][msg.sender] += _amount;
        emit Exchange__DepositToken(
            _token,
            msg.sender,
            _amount,
            s_tokens[_token][msg.sender]
        );
        return true;
    }

    function withdrawToken(
        address _token,
        uint256 _amount
    ) public returns (bool success) {
        require(
            _amount <= getBalance(_token, msg.sender),
            "The balance is not enough"
        );
        Token(_token).transfer(msg.sender, _amount);
        s_tokens[_token][msg.sender] -= _amount;
        emit Exchange__WithdrawToken(
            _token,
            msg.sender,
            _amount,
            getBalance(_token, msg.sender)
        );
        return true;
    }

    function makeOrder(
        address _tokenGet,
        uint256 _amountGet,
        address _tokenGive,
        uint256 _amountGive
    ) public {
        s_orderId++;
        require(_amountGive <= getBalance(_tokenGive, msg.sender));
        s_order[s_orderId] = _Order(
            s_orderId,
            msg.sender,
            _tokenGet,
            _amountGet,
            _tokenGive,
            _amountGive,
            block.timestamp
        );
        emit Exchange__MakeOrder(
            s_orderId,
            msg.sender,
            _tokenGet,
            _amountGet,
            _tokenGive,
            _amountGive,
            block.timestamp
        );
    }

    function cancelOrder(uint256 _orderId) public {
        require(!s_cancelledOrder[_orderId], " It is already cancelled ");
        _Order storage order = s_order[_orderId];
        require(
            order.owner == msg.sender,
            "The order can only be cancelled by the owner"
        );
        s_cancelledOrder[_orderId] = true;
        emit Exchange__CancelOrder(
            _orderId,
            order.owner,
            order.tokenGet,
            order.amountGet,
            order.tokenGive,
            order.amountGive,
            block.timestamp
        );
    }

    function fillOrder(uint256 _orderId) public {
        require(
            0 < _orderId && s_orderId >= _orderId,
            "Order id doesnot exist"
        );
        require(!s_cancelledOrder[_orderId], "This order is already cancelled");
        require(!s_filledOrder[_orderId], "This order is already filled");
        _Order storage order = s_order[_orderId];
        _trade(
            order.orderId,
            order.owner,
            order.tokenGet,
            order.amountGet,
            order.tokenGive,
            order.amountGive
        );
        s_filledOrder[_orderId] = true;
    }

    function getBalance(
        address _token,
        address _account
    ) public view returns (uint256) {
        return s_tokens[_token][_account];
    }

    //Functions to buy tokens
    function buyTokens(address _token) public payable {
        uint256 _amount = msg.value;
        require(Token(_token).balanceOf(address(this)) >= _amount);
        Token(_token).transfer(msg.sender, _amount);
        emit Exchange__TokenPurchased(msg.sender, _token, _amount);
    }

    function sellToken(address _token, uint256 _amount) public {
        uint256 _giveAmount = _amount;
        require(Token(_token).balanceOf(address(this)) >= _amount);
        require(address(this).balance >= _giveAmount);
        Token(_token).transferFrom(msg.sender, address(this), _amount);
        payable(msg.sender).transfer(_giveAmount);
        emit Exchange__TokenSold(msg.sender, _token, _amount);
    }

    function getFeeAccount() public view returns (address) {
        return i_feeAccount;
    }

    function getFeePercent() public view returns (uint256) {
        return i_feePercent;
    }

    function getOrderId() public view returns (uint256) {
        return s_orderId;
    }
}
