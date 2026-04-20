#!/usr/bin/env python3
"""
Health Module Personal Token System
基于身高、体重、年龄生成8位混合Token的个人认证系统
"""

import hashlib
import hmac
import string
import logging
from typing import Optional, Tuple

logger = logging.getLogger(__name__)

class HealthTokenManager:
    """健康模块个人Token管理器"""

    # 加密密钥（生产环境应从环境变量读取）
    SECRET_KEY = "ShopBack_Health_2024_SecretKey"

    @staticmethod
    def generate_token(height: int, weight: int, age: int) -> str:
        """
        生成8位混合Token

        算法：
        1. 身高的后2位
        2. 体重的哈希值（2个字符）
        3. 年龄的编码（2个字符）
        4. 校验码（2个字符）

        Args:
            height: 身高(cm)
            weight: 体重(kg)
            age: 年龄

        Returns:
            8位混合Token字符串
        """
        try:
            # 验证输入范围
            if not (100 <= height <= 250):
                raise ValueError(f"Invalid height: {height}")
            if not (30 <= weight <= 200):
                raise ValueError(f"Invalid weight: {weight}")
            if not (10 <= age <= 100):
                raise ValueError(f"Invalid age: {age}")

            # 1. 身高编码（2位）: 取后2位并加密
            height_part = str(height)[-2:]

            # 2. 体重编码（2位）: 使用简单哈希映射
            weight_hash = hashlib.sha256(f"{weight}{HealthTokenManager.SECRET_KEY}".encode()).hexdigest()
            weight_part = weight_hash[:1].upper() + weight_hash[-1].upper()

            # 3. 年龄编码（2位）: 转换为特殊编码
            age_encoded = HealthTokenManager._encode_age(age)

            # 4. 生成校验码（2位）: 基于所有信息的HMAC
            data = f"{height}{weight}{age}"
            checksum = hmac.new(
                HealthTokenManager.SECRET_KEY.encode(),
                data.encode(),
                hashlib.sha256
            ).hexdigest()
            checksum_part = checksum[0].upper() + checksum[5]

            # 组合Token
            token = f"{height_part}{weight_part}{age_encoded}{checksum_part}"

            logger.info(f"Generated token for H:{height} W:{weight} A:{age}")
            return token

        except Exception as e:
            logger.error(f"Error generating token: {e}")
            raise

    @staticmethod
    def validate_token(token: str, height: int, weight: int, age: int) -> bool:
        """
        验证Token是否匹配

        Args:
            token: 8位Token字符串
            height: 身高(cm)
            weight: 体重(kg)
            age: 年龄

        Returns:
            Token是否有效
        """
        try:
            if len(token) != 8:
                return False

            # 生成期望的Token
            expected_token = HealthTokenManager.generate_token(height, weight, age)

            # 比较Token
            return hmac.compare_digest(token.upper(), expected_token.upper())

        except Exception as e:
            logger.error(f"Error validating token: {e}")
            return False

    @staticmethod
    def _encode_age(age: int) -> str:
        """
        年龄特殊编码（2位）

        Args:
            age: 年龄

        Returns:
            2位编码字符串
        """
        # 使用年龄的平方根和模运算创建编码
        base = int(age ** 0.5) % 10
        offset = (age * 7) % 26

        # 生成一个字母和一个数字的组合
        letter = string.ascii_uppercase[offset]
        number = str((base + age % 10) % 10)

        return letter + number

    @staticmethod
    def decode_token_hints(token: str) -> dict:
        """
        解码Token获取提示信息（用于忘记Token时的恢复）

        Args:
            token: 8位Token字符串

        Returns:
            包含提示信息的字典
        """
        if len(token) != 8:
            return {"error": "Invalid token length"}

        try:
            # 解析Token结构
            height_hint = token[:2]
            weight_pattern = token[2:4]
            age_pattern = token[4:6]
            checksum = token[6:8]

            return {
                "height_last_digits": height_hint,
                "weight_pattern": weight_pattern,
                "age_pattern": age_pattern,
                "checksum": checksum,
                "hint": f"Height ends with {height_hint}, check your records"
            }
        except Exception as e:
            return {"error": str(e)}

    @staticmethod
    def generate_recovery_code(height: int, weight: int, age: int) -> str:
        """
        生成恢复码（用于忘记Token时）

        Args:
            height: 身高(cm)
            weight: 体重(kg)
            age: 年龄

        Returns:
            12位恢复码
        """
        # 使用更长的哈希作为恢复码
        data = f"{height}-{weight}-{age}-{HealthTokenManager.SECRET_KEY}"
        recovery = hashlib.sha256(data.encode()).hexdigest()[:12].upper()

        # 格式化为 XXXX-XXXX-XXXX
        return f"{recovery[:4]}-{recovery[4:8]}-{recovery[8:12]}"

    @staticmethod
    def create_user_profile_token(height: int, weight: int, age: int) -> dict:
        """
        创建完整的用户Token配置

        Args:
            height: 身高(cm)
            weight: 体重(kg)
            age: 年龄

        Returns:
            包含Token和恢复信息的字典
        """
        token = HealthTokenManager.generate_token(height, weight, age)
        recovery_code = HealthTokenManager.generate_recovery_code(height, weight, age)

        return {
            "token": token,
            "recovery_code": recovery_code,
            "hint": f"Your 8-digit health token: {token}",
            "example": "Use this token to access your personal health dashboard",
            "security_note": "Keep this token private. It's based on your physical metrics."
        }


# 测试示例
if __name__ == "__main__":
    # 你的例子：身高176，体重89，年龄26
    test_height = 176
    test_weight = 89
    test_age = 26

    # 生成Token
    profile = HealthTokenManager.create_user_profile_token(
        test_height, test_weight, test_age
    )

    print("=" * 50)
    print("Health Module Personal Token")
    print("=" * 50)
    print(f"Height: {test_height}cm")
    print(f"Weight: {test_weight}kg")
    print(f"Age: {test_age}")
    print("-" * 50)
    print(f"Your Token: {profile['token']}")
    print(f"Recovery Code: {profile['recovery_code']}")
    print("-" * 50)

    # 验证Token
    is_valid = HealthTokenManager.validate_token(
        profile['token'], test_height, test_weight, test_age
    )
    print(f"Token Validation: {'✓ Valid' if is_valid else '✗ Invalid'}")

    # 测试错误的Token
    wrong_token = "ABCD1234"
    is_valid_wrong = HealthTokenManager.validate_token(
        wrong_token, test_height, test_weight, test_age
    )
    print(f"Wrong Token Test: {'✓ Valid' if is_valid_wrong else '✗ Invalid'}")

    # Token提示
    hints = HealthTokenManager.decode_token_hints(profile['token'])
    print("\nToken Hints:")
    for key, value in hints.items():
        print(f"  {key}: {value}")