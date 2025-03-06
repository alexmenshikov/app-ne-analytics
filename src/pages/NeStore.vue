<script setup>
import { ref } from "vue";
import { useAnalyticsStore } from "@/stores/AnalyticsStore.js";
import NePageHeader from "@/components/NePageHeader.vue";
import {
  Row as ARow,
  Col as ACol,
  Form as AForm,
  FormItem as AFormItem,
  Input as AInput,
  Select as ASelect,
  Button as AButton,
  Popconfirm as APopconfirm,
  Modal as AModal,
  Table as ATable,
} from "ant-design-vue";
import {
  PlusOutlined,
  EditOutlined as AEditOutlined,
  DeleteOutlined as ADeleteOutlined,
} from "@ant-design/icons-vue";

const analyticsStore = useAnalyticsStore();

const open = ref(false);

const initialCompany = {
  marketplace: {
    value: analyticsStore.marketplaces[0].value,
    label: analyticsStore.marketplaces[0].label
  },
  accessMethod: {
    value: analyticsStore.accessMethods[0].value,
    label: analyticsStore.accessMethods[0].label,
  },
  company: "",
  apiToken: "",
};

const company = ref({ ...initialCompany });

const handleMarketplaceChange = (selectedOption) => {
  company.value.marketplace = {
    value: selectedOption.value,
    label: selectedOption.label,
  };
};

const handleAccessMethodChange = (selectedOption) => {
  company.value.accessMethod = {
    value: selectedOption.value,
    label: selectedOption.label,
  };
};

const companyEdit = (selectedOption) => {
  showModal();
  company.value = selectedOption;
  // analyticsStore.(company.value);
}

const resetCompany = () => {
  company.value = { ...initialCompany };
};

const showModal = () => {
  open.value = true;
};

const hideModal = () => {
  open.value = false;
  analyticsStore.addCompany(company.value);
  resetCompany();
};

const columns = [
  {
    title: 'Магазин',
    dataIndex: 'company',
    key: 'company',
  },
  {
    title: 'Доступ к методам',
    dataIndex: 'accessMethod',
    key: 'accessMethod',
  },
  {
    title: 'Действия',
    dataIndex: 'actions',
    key: 'actions',
    fixed: "right",
    width: 140,
  },
];
</script>

<template>
  <ne-page-header title="Мои магазины">
    <template #extra>
      <a-button
        type="primary"
        @click="showModal"
      >
        <template #icon>
          <plus-outlined />
        </template>
        Добавить магазин
      </a-button>
    </template>
  </ne-page-header>

  <div class="page">
    <a-modal
      v-model:open="open"
      title="Добавление магазина"
      ok-text="Добавить"
      cancel-text="Отменить"
      @ok="hideModal"
    >
      <a-form ref="form" layout="vertical" class="form">
        <a-row :gutter="24">
          <a-col :span="24">
            <a-form-item label="Выберите маркетплейс" name="marketplaces">
              <a-select
                :options="analyticsStore.marketplaces"
                v-model:value="company.marketplace"
                label-in-value
                @change="handleMarketplaceChange"
              >
                <template #option="{ label, logo }">
                  <div style="display: flex; align-items: center">
                    <img :src="logo" :alt="label" style="width: 20px; height: 20px; margin-right: 8px" />
                    <span>{{ label }}</span>
                  </div>
                </template>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="24">
          <a-col :span="24">
            <a-form-item label="Название магазина" name="nameStore">
              <a-input
                v-model:value="company.company"
                placeholder="Введите название"
              />
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="24">
          <a-col :span="24">
            <a-form-item label="Доступ к методам" name="accessMethod">
              <a-select
                :options="analyticsStore.accessMethods"
                v-model:value="company.accessMethod"
                label-in-value
                @change="handleAccessMethodChange"
              />
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="24">
          <a-col :span="24">
            <a-form-item label="API ключ" name="apiToken">
              <a-input
                v-model:value="company.apiToken"
                placeholder="Введите api ключ"
              />
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-modal>

    <a-table
      :dataSource="analyticsStore.companyArray"
      :columns="columns"
    >
      <template #bodyCell="{ column, record, index }">
        <template v-if="column.key === 'company'">
          <div style="display: flex; align-items: center">
            <img :src="record.marketplace.logo" :alt="record.marketplace.label" style="width: 20px; height: 20px; margin-right: 8px" />
            <span>{{ record.company }}</span>
          </div>
        </template>

        <template v-if="column.key === 'accessMethod'">
          <span>{{ record.accessMethod.label }}</span>
        </template>

        <template v-if="column.key === 'actions'">
          <div class="cell-actions-action default">
            <a-edit-outlined />
            <span>Редактировать</span>
          </div>

          <a-popconfirm
            title="Удалить компанию?"
            ok-text="Да"
            cancel-text="Нет"
            @confirm="analyticsStore.removeCompany(record.id)"
          >
            <div class="cell-actions-action delete">
              <a-delete-outlined />
              <span>Удалить</span>
            </div>
          </a-popconfirm>
        </template>
      </template>
    </a-table>
  </div>
</template>

<style scoped>
.page {
  padding: 16px 24px 16px;
}

.cell-actions-action {
  font-size: 11px;
  cursor: pointer;
  color: #333;
  display: inline-block;
  align-items: center;
}

.cell-actions-action span {
  margin-left: 5px;
}

.cell-actions-action.default:hover {
  color: #1890ff;
}

.cell-actions-action.delete:hover {
  color: tomato;
}
</style>